DROP TABLE IF EXISTS `usate_team`;
CREATE TABLE `usate_team`
(
    id     INT AUTO_INCREMENT PRIMARY KEY,
    name   VARCHAR(255) NULL,
    rating INT UNSIGNED NULL
);
INSERT INTO `usate_team`
VALUES (1, 'Garden State Passers', 2180),
       (2, 'The Secret Square', 2160),
       (3, 'Salt Free Gaming', 2150),
       (4, 'Pure Salt Gaming', 2140);

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
INSERT INTO `usate_player`
VALUES (1, 1, 'GM Mackenzie Molner', 'PassersGG', 2531),
       (2, 1, 'Sean Finn', 'JerseyFish', 2070),
       (3, 1, 'Danny Rohde', 'rohde', 1900),
       (4, 1, 'Arrik Leman', 'arrik', 1772),
       (5, 2, 'FM Dov Gorman', 'PassersGG', 2342),
       (6, 2, 'Dan Smith', 'PokerDan', 2150),
       (7, 2, 'Ethan Klein', 'EthanKlein_NJ', 2081),
       (8, 2, 'Ted Bartman', 'DoTheBartman', 2000),
       (9, 3, 'NM Dave Grasso', 'DavidGrasso', 2252),
       (10, 3, 'John Mullanaphy', 'YourBoyKandy', 2083),
       (11, 3, 'Max Farberov', 'farbmates', 1900),
       (12, 3, 'Jim Mullanaphy', 'jmull', 1500),
       (13, 4, 'NM Jason Lu', 'energetichay05', 2181),
       (14, 4, 'Daniel Sprechman', 'sprek84', 1700),
       (15, 4, 'Hal Sprechman', 'sprek1', 1400),
       (16, 4, 'Bob Dude', 'bobdude', 1200);

DROP TABLE IF EXISTS `usate_pairing`;
CREATE TABLE `usate_pairing`
(
    id      INT AUTO_INCREMENT PRIMARY KEY,
    home_id INT UNSIGNED NULL,
    away_id INT UNSIGNED NULL,
    UNIQUE INDEX (home_id),
    UNIQUE INDEX (away_id)
);
INSERT INTO `usate_pairing`
VALUES (1, 1, 2),
       (2, 3, 4);

DROP TABLE IF EXISTS `usate_configuration`;
CREATE TABLE `usate_configuration`
(
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    show_programmatic_boards BOOLEAN      NULL,
    show_match_score         BOOLEAN      NULL,
    show_webcam              BOOLEAN      NULL,
    show_ad_unit             BOOLEAN      NULL,
    bottom_left_text         VARCHAR(255) NULL,
    bottom_middle_text       VARCHAR(255) NULL,
    bottom_right_text        VARCHAR(255) NULL
);
INSERT INTO `usate_configuration`
VALUES (1, 1, 1, 0, 1, 'Day 1', 'US Amateur Team East', 'Hosts: IM Tom Bartell & Dan Smith');
