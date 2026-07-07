-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'STAFF', 'VIEWER') NOT NULL DEFAULT 'STAFF',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `owners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_code` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `line_id` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `bank_name` VARCHAR(191) NULL,
    `bank_account_number` VARCHAR(191) NULL,
    `bank_account_name` VARCHAR(191) NULL,
    `promptpay_id` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `owners_owner_code_key`(`owner_code`),
    INDEX `owners_status_idx`(`status`),
    INDEX `owners_full_name_idx`(`full_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `properties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_code` VARCHAR(191) NOT NULL,
    `property_name` VARCHAR(191) NOT NULL,
    `property_type` ENUM('CONDO', 'APARTMENT', 'HOUSE', 'TOWNHOUSE', 'COMMERCIAL', 'DORMITORY', 'OTHER') NOT NULL DEFAULT 'CONDO',
    `address` TEXT NULL,
    `province` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `subdistrict` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `contact_name` VARCHAR(191) NULL,
    `contact_phone` VARCHAR(191) NULL,
    `image_url` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `properties_property_code_key`(`property_code`),
    INDEX `properties_status_idx`(`status`),
    INDEX `properties_province_idx`(`province`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_code` VARCHAR(191) NOT NULL,
    `property_id` INTEGER NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `room_number` VARCHAR(191) NOT NULL,
    `floor` VARCHAR(191) NULL,
    `room_size` DECIMAL(8, 2) NULL,
    `room_type` VARCHAR(191) NULL,
    `default_rent_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `default_deposit` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `default_cleaning_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `default_commission` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    `image_url` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rooms_room_code_key`(`room_code`),
    INDEX `rooms_property_id_idx`(`property_id`),
    INDEX `rooms_owner_id_idx`(`owner_id`),
    INDEX `rooms_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_code` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `line_id` VARCHAR(191) NULL,
    `id_card_or_passport` VARCHAR(191) NULL,
    `nationality` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `blacklist` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tenants_tenant_code_key`(`tenant_code`),
    INDEX `tenants_status_idx`(`status`),
    INDEX `tenants_full_name_idx`(`full_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_contracts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contract_code` VARCHAR(191) NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `room_id` INTEGER NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `property_id` INTEGER NOT NULL,
    `rental_type` ENUM('DAILY', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `rent_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `deposit_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `cleaning_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `other_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `booking_channel` VARCHAR(191) NULL,
    `rental_status` ENUM('BOOKED', 'CHECKED_IN', 'ENDED', 'CANCELLED') NOT NULL DEFAULT 'BOOKED',
    `payment_status` ENUM('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'UNPAID',
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rental_contracts_contract_code_key`(`contract_code`),
    INDEX `rental_contracts_tenant_id_idx`(`tenant_id`),
    INDEX `rental_contracts_room_id_idx`(`room_id`),
    INDEX `rental_contracts_owner_id_idx`(`owner_id`),
    INDEX `rental_contracts_property_id_idx`(`property_id`),
    INDEX `rental_contracts_rental_status_idx`(`rental_status`),
    INDEX `rental_contracts_payment_status_idx`(`payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `income_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `income_code` VARCHAR(191) NOT NULL,
    `contract_id` INTEGER NOT NULL,
    `tenant_id` INTEGER NULL,
    `room_id` INTEGER NULL,
    `owner_id` INTEGER NULL,
    `property_id` INTEGER NULL,
    `income_date` DATETIME(3) NOT NULL,
    `income_type` ENUM('RENT', 'DEPOSIT', 'CLEANING', 'WATER', 'ELECTRICITY', 'PENALTY', 'OTHER') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` ENUM('CASH', 'BANK_TRANSFER', 'PROMPTPAY', 'CREDIT_CARD', 'OTHER') NOT NULL,
    `receiving_account_id` INTEGER NULL,
    `transaction_reference` VARCHAR(191) NULL,
    `proof_file_url` VARCHAR(191) NULL,
    `verification_status` ENUM('DRAFT', 'PENDING', 'VERIFIED', 'NEEDS_FIX', 'CANCELLED', 'PROBLEM') NOT NULL DEFAULT 'DRAFT',
    `recorded_by` INTEGER NULL,
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `income_transactions_income_code_key`(`income_code`),
    INDEX `income_transactions_contract_id_idx`(`contract_id`),
    INDEX `income_transactions_room_id_idx`(`room_id`),
    INDEX `income_transactions_owner_id_idx`(`owner_id`),
    INDEX `income_transactions_income_date_idx`(`income_date`),
    INDEX `income_transactions_verification_status_idx`(`verification_status`),
    INDEX `income_transactions_income_date_amount_payment_method_transa_idx`(`income_date`, `amount`, `payment_method`, `transaction_reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expense_code` VARCHAR(191) NOT NULL,
    `expense_date` DATETIME(3) NOT NULL,
    `room_id` INTEGER NOT NULL,
    `owner_id` INTEGER NULL,
    `property_id` INTEGER NULL,
    `contract_id` INTEGER NULL,
    `expense_type` ENUM('CLEANING', 'REPAIR', 'MATERIAL', 'WATER', 'ELECTRICITY', 'INTERNET', 'COMMON_AREA', 'TRAVEL', 'ADMIN', 'ADVERTISING', 'OTHER') NOT NULL,
    `description` TEXT NULL,
    `payee_name` VARCHAR(191) NULL,
    `payee_phone` VARCHAR(191) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` ENUM('CASH', 'BANK_TRANSFER', 'PROMPTPAY', 'CREDIT_CARD', 'OTHER') NOT NULL,
    `payment_account_id` INTEGER NULL,
    `responsibility_type` ENUM('BROKER', 'OWNER', 'TENANT') NOT NULL DEFAULT 'BROKER',
    `proof_file_url` VARCHAR(191) NULL,
    `before_image_url` VARCHAR(191) NULL,
    `after_image_url` VARCHAR(191) NULL,
    `verification_status` ENUM('DRAFT', 'PENDING', 'VERIFIED', 'NEEDS_FIX', 'CANCELLED', 'PROBLEM') NOT NULL DEFAULT 'DRAFT',
    `recorded_by` INTEGER NULL,
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `expense_transactions_expense_code_key`(`expense_code`),
    INDEX `expense_transactions_room_id_idx`(`room_id`),
    INDEX `expense_transactions_owner_id_idx`(`owner_id`),
    INDEX `expense_transactions_expense_date_idx`(`expense_date`),
    INDEX `expense_transactions_verification_status_idx`(`verification_status`),
    INDEX `expense_transactions_responsibility_type_idx`(`responsibility_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `owner_payouts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payout_code` VARCHAR(191) NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `room_id` INTEGER NULL,
    `property_id` INTEGER NULL,
    `contract_id` INTEGER NULL,
    `payout_date` DATETIME(3) NOT NULL,
    `gross_income_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `deduction_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `net_payout_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `payment_method` ENUM('CASH', 'BANK_TRANSFER', 'PROMPTPAY', 'CREDIT_CARD', 'OTHER') NULL,
    `owner_bank_account` VARCHAR(191) NULL,
    `transaction_reference` VARCHAR(191) NULL,
    `proof_file_url` VARCHAR(191) NULL,
    `payout_status` ENUM('PENDING', 'PARTIAL', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `verification_status` ENUM('DRAFT', 'PENDING', 'VERIFIED', 'NEEDS_FIX', 'CANCELLED', 'PROBLEM') NOT NULL DEFAULT 'DRAFT',
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `owner_payouts_payout_code_key`(`payout_code`),
    INDEX `owner_payouts_owner_id_idx`(`owner_id`),
    INDEX `owner_payouts_payout_date_idx`(`payout_date`),
    INDEX `owner_payouts_payout_status_idx`(`payout_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payout_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payout_id` INTEGER NOT NULL,
    `source_type` VARCHAR(191) NOT NULL,
    `source_id` INTEGER NULL,
    `label` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payout_items_payout_id_idx`(`payout_id`),
    UNIQUE INDEX `payout_items_source_type_source_id_key`(`source_type`, `source_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_name` VARCHAR(191) NOT NULL,
    `bank_name` VARCHAR(191) NULL,
    `account_number` VARCHAR(191) NULL,
    `account_holder_name` VARCHAR(191) NULL,
    `promptpay_id` VARCHAR(191) NULL,
    `account_type` ENUM('RECEIVE_TENANT', 'PAY_OWNER', 'PERSONAL', 'CASH') NOT NULL,
    `qr_code_url` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payment_accounts_account_type_idx`(`account_type`),
    INDEX `payment_accounts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'CANCEL', 'ADJUST', 'LOGIN') NOT NULL,
    `table_name` VARCHAR(191) NOT NULL,
    `record_id` INTEGER NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `ip_address` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_table_name_record_id_idx`(`table_name`, `record_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `code_sequences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `last_no` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `code_sequences_entity_period_key`(`entity`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_contracts` ADD CONSTRAINT `rental_contracts_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_contracts` ADD CONSTRAINT `rental_contracts_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_contracts` ADD CONSTRAINT `rental_contracts_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_contracts` ADD CONSTRAINT `rental_contracts_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_transactions` ADD CONSTRAINT `income_transactions_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `rental_contracts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_transactions` ADD CONSTRAINT `income_transactions_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_transactions` ADD CONSTRAINT `income_transactions_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_transactions` ADD CONSTRAINT `income_transactions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_transactions` ADD CONSTRAINT `income_transactions_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_transactions` ADD CONSTRAINT `income_transactions_receiving_account_id_fkey` FOREIGN KEY (`receiving_account_id`) REFERENCES `payment_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_transactions` ADD CONSTRAINT `income_transactions_recorded_by_fkey` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_transactions` ADD CONSTRAINT `income_transactions_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_transactions` ADD CONSTRAINT `expense_transactions_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_transactions` ADD CONSTRAINT `expense_transactions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_transactions` ADD CONSTRAINT `expense_transactions_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_transactions` ADD CONSTRAINT `expense_transactions_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `rental_contracts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_transactions` ADD CONSTRAINT `expense_transactions_payment_account_id_fkey` FOREIGN KEY (`payment_account_id`) REFERENCES `payment_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_transactions` ADD CONSTRAINT `expense_transactions_recorded_by_fkey` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_transactions` ADD CONSTRAINT `expense_transactions_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `owner_payouts` ADD CONSTRAINT `owner_payouts_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `owner_payouts` ADD CONSTRAINT `owner_payouts_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `owner_payouts` ADD CONSTRAINT `owner_payouts_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `owner_payouts` ADD CONSTRAINT `owner_payouts_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `rental_contracts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_items` ADD CONSTRAINT `payout_items_payout_id_fkey` FOREIGN KEY (`payout_id`) REFERENCES `owner_payouts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
