CREATE TABLE IF NOT EXISTS `business_safe_registry` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `safe_id` varchar(50) NOT NULL,
  `owner_name` varchar(100) NOT NULL,
  `owner_doc` varchar(50) NOT NULL,
  `assigned_by` varchar(100) DEFAULT NULL,
  `assigned_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `last_renewed_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `safe_id` (`safe_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `business_payslips` (
  `id` varchar(50) NOT NULL,
  `business_id` varchar(50) NOT NULL,
  `beneficiary` varchar(100) NOT NULL,
  `amount` int(11) NOT NULL,
  `status` enum('active','revoked','cashed') DEFAULT 'active',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
