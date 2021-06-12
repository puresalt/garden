UPDATE `nosc_configuration`
SET bottom_middle_text = '<span>Round:</span> 1 of 6'
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


INSERT INTO `nosc_pairing`
VALUES (1, 1, 87, 103, 'K-6', 3),
       (2, 2, 104, 88, 'K-6', NULL),
       (3, 3, 89, 105, 'K-6', NULL),
       (4, 4, 106, 90, 'K-6', NULL),
       (5, 5, 91, 107, 'K-6', NULL),
       (6, 6, 108, 92, 'K-6', NULL),
       (7, 7, 93, 109, 'K-6', NULL),
       (8, 8, 110, 94, 'K-6', NULL),
       (9, 9, 95, 111, 'K-6', NULL),
       (10, 10, 112, 96, 'K-6', NULL),
       (11, 11, 97, 113, 'K-6', NULL),
       (12, 12, 114, 98, 'K-6', NULL),
       (13, 13, 99, 115, 'K-6', NULL),
       (14, 14, 116, 100, 'K-6', NULL),
       (15, 15, 101, 117, 'K-6', NULL),
       (16, 16, 118, 102, 'K-6', NULL);
INSERT INTO `nosc_pairing`
VALUES (17, 1, 141, 119, 'K-5', 4),
       (18, 2, 120, 143, 'K-5', NULL),
       (19, 3, 144, 121, 'K-5', NULL),
       (20, 4, 123, 142, 'K-5', NULL),
       (21, 5, 145, 124, 'K-5', NULL),
       (22, 6, 125, 146, 'K-5', NULL),
       (23, 7, 147, 126, 'K-5', NULL),
       (24, 8, 127, 148, 'K-5', NULL),
       (25, 9, 149, 128, 'K-5', NULL),
       (26, 10, 129, 150, 'K-5', NULL),
       (27, 11, 163, 130, 'K-5', NULL),
       (28, 12, 131, 151, 'K-5', NULL),
       (29, 13, 152, 132, 'K-5', NULL),
       (30, 14, 133, 153, 'K-5', NULL),
       (31, 15, 154, 134, 'K-5', NULL),
       (32, 16, 135, 155, 'K-5', NULL),
       (33, 17, 156, 136, 'K-5', NULL),
       (34, 18, 158, 137, 'K-5', NULL),
       (35, 19, 138, 159, 'K-5', NULL),
       (36, 20, 160, 139, 'K-5', NULL),
       (37, 21, 140, 161, 'K-5', NULL);
INSERT INTO `nosc_pairing`
VALUES (38, 1, 164, 188, 'K-3', 5),
       (39, 2, 189, 165, 'K-3', NULL),
       (40, 3, 166, 190, 'K-3', NULL),
       (41, 4, 191, 167, 'K-3', NULL),
       (42, 5, 168, 192, 'K-3', NULL),
       (43, 6, 193, 169, 'K-3', NULL),
       (44, 7, 170, 194, 'K-3', NULL),
       (45, 8, 195, 171, 'K-3', NULL),
       (46, 9, 172, 196, 'K-3', NULL),
       (47, 10, 197, 173, 'K-3', NULL),
       (48, 11, 174, 198, 'K-3', NULL),
       (49, 12, 199, 175, 'K-3', NULL),
       (50, 13, 176, 200, 'K-3', NULL),
       (51, 14, 201, 177, 'K-3', NULL),
       (52, 15, 178, 202, 'K-3', NULL),
       (53, 16, 203, 179, 'K-3', NULL),
       (54, 17, 180, 204, 'K-3', NULL),
       (55, 18, 205, 181, 'K-3', NULL),
       (56, 19, 182, 206, 'K-3', NULL),
       (57, 20, 207, 183, 'K-3', NULL),
       (58, 21, 184, 208, 'K-3', NULL),
       (59, 22, 209, 185, 'K-3', NULL),
       (60, 23, 187, 210, 'K-3', NULL);
INSERT INTO `nosc_pairing`
VALUES (61, 1, 212, 228, 'K-1', 6),
       (62, 2, 229, 213, 'K-1', NULL),
       (63, 3, 214, 230, 'K-1', NULL),
       (64, 4, 231, 215, 'K-1', NULL),
       (65, 5, 216, 232, 'K-1', NULL),
       (66, 6, 233, 217, 'K-1', NULL),
       (67, 7, 218, 234, 'K-1', NULL),
       (68, 8, 235, 219, 'K-1', NULL),
       (69, 9, 220, 236, 'K-1', NULL),
       (70, 10, 237, 221, 'K-1', NULL),
       (71, 11, 222, 238, 'K-1', NULL),
       (72, 12, 239, 223, 'K-1', NULL),
       (73, 13, 224, 240, 'K-1', NULL),
       (74, 14, 241, 225, 'K-1', NULL),
       (75, 15, 226, 242, 'K-1', NULL),
       (76, 16, 243, 227, 'K-1', NULL);