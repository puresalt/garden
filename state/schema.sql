DROP TABLE IF EXISTS `usate_team`;
CREATE TABLE `usate_team`
(
    id     INT AUTO_INCREMENT PRIMARY KEY,
    name   VARCHAR(255) NULL,
    rating DECIMAL(4, 2) UNSIGNED NULL
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

DROP TABLE IF EXISTS `usate_configuration`;
CREATE TABLE `usate_configuration`
(
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    show_programmatic_boards BOOLEAN      NULL,
    show_match_score         BOOLEAN      NULL,
    show_scratch_board       BOOLEAN      NULL,
    show_webcam              BOOLEAN      NULL,
    show_ad_unit             BOOLEAN      NULL,
    bottom_left_text         VARCHAR(255) NULL,
    bottom_middle_text       VARCHAR(255) NULL,
    bottom_right_text        VARCHAR(255) NULL
);
INSERT INTO `usate_configuration`
VALUES (1, 1, 1, 0, 1, 'Day 1', 'US Amateur Team East', 'Hosts: IM Tom Bartell & Dan Smith');
