-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
