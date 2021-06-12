UPDATE `nosc_configuration`
SET bottom_middle_text = '<span>Round:</span> 4 of 6'
WHERE id = 1;

DROP TABLE IF EXISTS `nosc_pairing`;
CREATE TABLE `nosc_pairing`
(
    id                INT AUTO_INCREMENT PRIMARY KEY,
    board_id          INT UNSIGNED                                     NULL,
    home_id           INT UNSIGNED                                     NULL,
    away_id           INT UNSIGNED                                     NULL,
    section           ENUM ('K-1', 'K-3', 'K-5', 'K-6', 'K-9', 'K-12') NOT NULL,
    observer_board_id INT UNSIGNED                                     NULL,
    UNIQUE INDEX (home_id),
    UNIQUE INDEX (away_id)
);
