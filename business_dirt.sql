CREATE TABLE IF NOT EXISTS `business_dirt` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_key` varchar(50) NOT NULL,
  `dirt_id` int(11) NOT NULL,
  `prop` varchar(100) NOT NULL,
  `coords_x` float NOT NULL,
  `coords_y` float NOT NULL,
  `coords_z` float NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_dirt` (`business_key`, `dirt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
