import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Product, CreateProductDto, PrismaService } from '@shopit/shared';

@Injectable()
export class AppService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService
  ) {}

  private transformProduct(product: any): Product {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock
    };
  }

  private transformProducts(products: any[]): Product[] {
    return products.map(product => this.transformProduct(product));
  }

  async getProducts(): Promise<Product[]> {
    const cachedProducts = await this.cacheManager.get<Product[]>('all_products');
    if (cachedProducts) {
      return cachedProducts;
    }

    const products = await this.prisma.product.findMany();
    const transformedProducts = this.transformProducts(products);
    await this.cacheManager.set('all_products', transformedProducts, 60);
    return transformedProducts;
  }

  async getProduct(id: string): Promise<Product | null> {
    const productId = parseInt(id, 10);
    const cachedProduct = await this.cacheManager.get<Product>(`product_${productId}`);
    if (cachedProduct) {
      return cachedProduct;
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (product) {
      const transformedProduct = this.transformProduct(product);
      await this.cacheManager.set(`product_${productId}`, transformedProduct, 60);
      return transformedProduct;
    }
    return null;
  }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const product = await this.prisma.product.create({
      data: createProductDto
    });
    
    await this.cacheManager.del('all_products');
    return this.transformProduct(product);
  }

  async updateProduct(id: number, updateData: Partial<Product>): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });
    
    await this.cacheManager.del('all_products');
    await this.cacheManager.del(`product_${id}`);
    
    return this.transformProduct(product);
  }

  async checkStock(items: Array<{ productId: number; quantity: number }>): Promise<{
    success: boolean;
    insufficientItems?: Array<{
      productId: number;
      requested: number;
      available: number;
    }>;
  }> {
    const insufficientItems: Array<{
      productId: number;
      requested: number;
      available: number;
    }> = [];

    // Get all product IDs to check
    const productIds = items.map(item => item.productId);
    
    // Get all products in one query
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds }
      }
    });

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        insufficientItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: product?.stock || 0,
        });
      }
    }

    return {
      success: insufficientItems.length === 0,
      insufficientItems: insufficientItems.length > 0 ? insufficientItems : undefined,
    };
  }

  async updateStock(items: Array<{ productId: number; quantity: number }>): Promise<void> {
    // Use transactions for bulk updates
    await this.prisma.$transaction(
      items.map(item => 
        this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      )
    );
    
    // Invalidate caches
    for (const item of items) {
      await this.cacheManager.del(`product_${item.productId}`);
    }
    await this.cacheManager.del('all_products');
  }

  async deleteProduct(id: number): Promise<void> {
    await this.prisma.product.delete({
      where: { id }
    });
    
    // Invalidate the products cache
    await this.cacheManager.del('all_products');
    await this.cacheManager.del(`product_${id}`);
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
