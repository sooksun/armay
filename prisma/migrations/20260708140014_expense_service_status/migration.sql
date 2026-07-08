-- AlterTable
ALTER TABLE `expense_transactions` ADD COLUMN `service_status` ENUM('NEW', 'PENDING', 'IN_PROGRESS', 'DONE', 'REVIEW', 'CLOSED') NULL;

-- CreateIndex
CREATE INDEX `expense_transactions_service_status_idx` ON `expense_transactions`(`service_status`);
