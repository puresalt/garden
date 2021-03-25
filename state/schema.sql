CREATE TABLE `garden_account`
(
    id       INT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(128) NULL,
    email    VARCHAR(255) NULL,
    password VARCHAR(255) NULL,
    discord  VARCHAR(255) NULL,
    deleted  BOOLEAN DEFAULT FALSE
);

CREATE TABLE `garden_team`
(
    id         INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT UNSIGNED NOT NULL,
    name       VARCHAR(128) NULL,
    website    VARCHAR(255) NULL,
    email      VARCHAR(255) NULL,
    deleted    BOOLEAN DEFAULT FALSE,
    INDEX (account_id)
);

CREATE TABLE `garden_player`
(
    id         INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT UNSIGNED NOT NULL,
    team_id    INT UNSIGNED NULL,
    name       VARCHAR(255) NULL,
    website    VARCHAR(255) NULL,
    email      VARCHAR(255) NULL,
    handle     VARCHAR(255) NULL,
    rating     INT UNSIGNED NULL,
    INDEX (account_id),
    INDEX (team_id)
);

CREATE TABLE `garden_event`
(
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    account_id               INT UNSIGNED                                                                                             NOT NULL,
    name                     VARCHAR(128)                                                                                             NULL,
    venue                    ENUM ('ICC', 'LICHESS', 'FICS')                                                                          NULL,
    type                     ENUM ('MATCH_TEAM', 'MATCH_INDIVIDUAL', 'TOURNAMENT_TEAM', 'TOURNAMENT_INDIVIDUAL', 'SIMUL', 'BUGHOUSE') NULL,
    deleted                  BOOLEAN DEFAULT FALSE,
    host_name                VARCHAR(128)                                                                                             NULL,
    show_webcam              BOOLEAN DEFAULT FALSE,
    host_instagram           BOOLEAN DEFAULT FALSE,
    host_twitter             BOOLEAN DEFAULT FALSE,
    host_twitch              BOOLEAN DEFAULT FALSE,
    show_ad_unit             BOOLEAN DEFAULT FALSE,
    show_programmatic_boards BOOLEAN DEFAULT FALSE,
    show_debug_information   BOOLEAN DEFAULT FALSE,
    INDEX (account_id),
    INDEX (event_id)
);

CREATE TABLE `garden_event_simul`
(
    id         INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT UNSIGNED NOT NULL,
    event_id   INT UNSIGNED NOT NULL,
    player_id  INT UNSIGNED NOT NULL,
    INDEX (account_id),
    INDEX (event_id),
    INDEX (player_id)
);

CREATE TABLE `garden_event_bughouse`
(
    id         INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT UNSIGNED NOT NULL,
    event_id   INT UNSIGNED NOT NULL,
    player_id  INT UNSIGNED NOT NULL,
    partner_id INT UNSIGNED NOT NULL,
    INDEX (account_id),
    INDEX (event_id),
    INDEX (player_id),
    INDEX (player_id)
);

CREATE TABLE `garden_event_team_pairing`
(
    id            INT AUTO_INCREMENT PRIMARY KEY,
    account_id    INT UNSIGNED NOT NULL,
    event_id      INT UNSIGNED NOT NULL,
    team_white_id INT UNSIGNED NULL,
    team_black_id INT UNSIGNED NULL,
    INDEX (account_id),
    INDEX (event_id),
    INDEX (team_white_id),
    INDEX (team_black_id)
);

CREATE TABLE `garden_event_individual_pairing`
(
    id              INT AUTO_INCREMENT PRIMARY KEY,
    account_id      INT UNSIGNED  NOT NULL,
    event_id        INT UNSIGNED  NOT NULL,
    team_pairing_id INT UNSIGNED  NULL,
    player_white_id INT UNSIGNED  NOT NULL,
    player_black_id INT UNSIGNED  NOT NULL,
    board_id        INT UNSIGNED  NOT NULL,
    result          DECIMAL(2, 1) NULL,
    INDEX (event_id),
    INDEX (team_pairing_id),
    INDEX (player_white_id),
    INDEX (player_black_id)
);
