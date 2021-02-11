DROP TABLE IF EXISTS `usate_team`;
CREATE TABLE `usate_team`
(
    id     INT AUTO_INCREMENT PRIMARY KEY,
    name   VARCHAR(255) NULL,
    rating INT UNSIGNED NULL
);

DROP TABLE IF EXISTS `usate_player`;
create TABLE `usate_player`
(
    id      INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT UNSIGNED NOT NULL,
    name    VARCHAR(255) NULL,
    handle  VARCHAR(255) NULL,
    rating  INT UNSIGNED NULL,
    INDEX (team_id)
);

DROP TABLE IF EXISTS `usate_pairing`;
CREATE TABLE `usate_pairing`
(
    id      INT AUTO_INCREMENT PRIMARY KEY,
    home_id INT UNSIGNED NULL,
    away_id INT UNSIGNED NULL,
    UNIQUE INDEX (home_id),
    UNIQUE INDEX (away_id)
);

