DROP TABLE IF EXISTS `college_team`;
CREATE TABLE `college_team`
(
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NULL
);
INSERT INTO `college_team`
VALUES (1, 'The University of Texas Rio'),
       (2, 'Webster University'),
       (3, 'Saint Louis University'),
       (4, 'Texas Tech University');

DROP TABLE IF EXISTS `college_player`;
CREATE TABLE `college_player`
(
    id      INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT UNSIGNED NOT NULL,
    name    VARCHAR(255) NULL,
    handle  VARCHAR(255) NULL,
    rating  INT UNSIGNED NULL,
    INDEX (team_id)
);
INSERT INTO `college_player`
VALUES (1, 1, 'GM Vladimir Fedoseev', 'RIO-Fedoseev', 2760),
       (2, 1, 'GM Hovhannes Gabuzyan', 'RIO-Gabuzyan', 2664),
       (3, 1, 'GM Vladimir Belous', 'RIO-Belous', 2620),
       (4, 2, 'GM Kamil Dragun', 'RIO-Dragun', 2611),
       (5, 1, 'GM Lazaro Bruzon Batista', 'WEB-Bruzon', 2725),
       (6, 2, 'GM Benjamin Gledura', 'WEB-Glendura', 2721),
       (7, 2, 'GM Aleksandr Lenderman', 'WEB-Lenderman', 2704),
       (8, 2, 'GM Aram Hakobyan', 'WEB-Hakobyan', 2683),
       (9, 3, 'GM Dariusz Swiercz', 'SLU-Swiercz', 2733),
       (10, 3, 'GM Alexander Ipatov', 'SLU-Ipatov', 2714),
       (11, 3, 'GM Benjamin Bok', 'SLU-Bok', 2668),
       (12, 4, 'IM Nikolas Theodorou', 'SLU-Theodorou', 2641),
       (13, 3, 'GM Andrey Baryshpolets', 'TTU-Baryshpolet', 2647),
       (14, 4, 'GM Pavlo Vorontsov', 'TTU-Vorontsov', 2631),
       (15, 4, 'FM Aleksey Sorokin', 'TTU-Sorokin', 2628),
       (16, 4, 'IM Samuel Arthur Schmakel', 'TTU-Schmakel', 2490);

DROP TABLE IF EXISTS `college_pairing`;
CREATE TABLE `college_pairing`
(
    id      INT AUTO_INCREMENT PRIMARY KEY,
    home_id INT UNSIGNED NULL,
    away_id INT UNSIGNED NULL,
    UNIQUE INDEX (home_id),
    UNIQUE INDEX (away_id)
);
INSERT INTO `college_pairing`
VALUES (1, 4, 1),
       (2, 3, 2);

DROP TABLE IF EXISTS `college_configuration`;
CREATE TABLE `college_configuration`
(
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    show_programmatic_boards BOOLEAN DEFAULT FALSE,
    show_scratch_board       BOOLEAN DEFAULT FALSE,
    show_ad_unit             BOOLEAN DEFAULT FALSE,
    show_sponsor_unit        BOOLEAN DEFAULT FALSE,
    next_round_start         DATETIME     NULL,
    bottom_left_text         VARCHAR(255) NULL,
    bottom_middle_text       VARCHAR(255) NULL,
    bottom_right_text        VARCHAR(255) NULL
);
INSERT INTO `college_configuration`
VALUES (1, true, true, false, true, '2021-04-03 12:00:00', '<span>Featuring:</span> John & Sean',
        '<span>Round:</span> 1 of 6',
        '<span><i class="fab fa-twitch"></i><i class="fab fa-twitter"></i><i class="fab fa-instagram"></i><i class="fab fa-facebook"></i></span> PassersGG');
