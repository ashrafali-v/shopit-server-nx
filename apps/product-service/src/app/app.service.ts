import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Product, CreateProductDto } from '@shopit/shared';

@Injectable()
export class AppService {
  private products: Product[] = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description 1',
      price: 999.99,
      stock: 10,
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description 2',
      price: 699.99,
      stock: 15,
    },
  ];

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getProducts(): Promise<Product[]> {
    // Try to get products from cache
    const cachedProducts = await this.cacheManager.get<Product[]>('all_products');
    if (cachedProducts) {
      return cachedProducts;
    }

    // If not in cache, simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Store in cache for 1 minute (60 seconds)
    await this.cacheManager.set('all_products', this.products, 60);
    return this.products;
  }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const product: Product = {
      id: Math.floor(Math.random() * 1000),
      ...createProductDto
    };
    
    this.products.push(product);
    
    // Invalidate the products cache
    await this.cacheManager.del('all_products');
    
    return product;
  }

  async updateProduct(id: number, updateData: Partial<Product>): Promise<Product> {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }
    
    this.products[index] = {
      ...this.products[index],
      ...updateData
    };
    
    // Invalidate the products cache
    await this.cacheManager.del('all_products');
    
    return this.products[index];
  }

  async updateStock(items: Array<{ productId: number; quantity: number }>): Promise<void> {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    for (const item of items) {
      const product = this.products.find(p => p.id === item.productId);
      if (product) {
        product.stock = item.quantity;
      }
    }
    
    // Invalidate the products cache since stock levels changed
    await this.cacheManager.del('all_products');
  }

  async deleteProduct(id: number): Promise<void> {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const index = this.products.findIndex(p => p.id === id);
    if (index > -1) {
      this.products.splice(index, 1);
      // Invalidate the products cache
      await this.cacheManager.del('all_products');
    }
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
