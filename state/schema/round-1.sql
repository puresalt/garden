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
VALUES (1, 1, 'GM Mateusz Bartel', 'RIO-Bartel', 2760),
       (2, 1, 'GM Hovhannes Gabuzyan', 'RIO-Gabuzyan', 2664),
       (3, 1, 'GM Kamil Dragun', 'RIO-Dragun', 2611),
       (4, 1, 'GM Vladimir Belous', 'RIO-Belous', 2620),

       (5, 2, 'GM Lazaro Bruzon Batista', 'WEB-Bruzon', 2725),
       (6, 2, 'GM Benjamin Gledura', 'WEB-Glendura', 2721),
       (7, 2, 'GM Quesada Perez Yuniesky', 'WEB-Quesada', 2704),
       (8, 2, 'GM Aram Hakobyan', 'WEB-Hakobyan', 2683),

       (9, 3, 'GM Dariusz Swiercz', 'SLU-Swiercz', 2733),
       (10, 3, 'GM Benjamin Bok', 'SLU-Bok', 2668),
       (11, 3, 'IM Nikolas Theodorou', 'SLU-Theodorou', 2641),
       (12, 3, 'GM Akshat Chandra', 'SLU-Chandra', 2714),

       (13, 4, 'GM Pavlo Vorontsov', 'TTU-Vorontsov', 2631),
       (14, 4, 'FM Aleksey Sorokin', 'TTU-Sorokin', 2628),
       (15, 4, 'IM Semen Khanin', 'TTU-Khanin', 2647),
       (16, 4, 'IM Viktor Matviishen', 'TTU-Matviishen', 2490);

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