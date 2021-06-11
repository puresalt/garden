DROP TABLE IF EXISTS `nosc_configuration`;
CREATE TABLE `nosc_configuration`
(
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    show_programmatic_boards BOOLEAN DEFAULT FALSE,
    show_scratch_board       BOOLEAN DEFAULT FALSE,
    show_sponsor_unit        BOOLEAN DEFAULT FALSE,
    next_round_start         DATETIME     NULL,
    bottom_left_text         VARCHAR(255) NULL,
    bottom_middle_text       VARCHAR(255) NULL,
    bottom_right_text        VARCHAR(255) NULL
);
INSERT INTO `nosc_configuration`
VALUES (1, true, true, true, '2021-06-12 15:00:00', '<span>Featuring:</span> GM Nicolas Checa',
        '<span>Round:</span> 1 of 8',
        '<span><i class="fab fa-twitch"></i><i class="fab fa-twitter"></i><i class="fab fa-instagram"></i><i class="fab fa-facebook"></i></span> PassersGG');
