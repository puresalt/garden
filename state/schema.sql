CREATE TABLE `garden_manager` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NULL,
    email VARCHAR(255) NULL,
    password VARCHAR(255) NULL,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE `garden_team` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manager_id INT UNSIGNED NOT NULL,
    name VARCHAR(128) NULL,
    state VARCHAR(2) NULL,
    website VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    deleted BOOLEAN DEFAULT FALSE,
    INDEX (manager_id)
);

CREATE TABLE `garden_member` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT UNSIGNED NOT NULL,
    title VARCHAR(3) NULL,
    name VARCHAR(128) NULL,
    lichess_handle VARCHAR(128) NULL,
    rating SMALLINT UNSIGNED NULL,
    deleted BOOLEAN DEFAULT FALSE,
    INDEX(team_id)
);


CREATE TABLE `garden_member_profile` (
    member_id INT UNSIGNED,
    avatar VARCHAR(255) NULL,
    website VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    bio TEXT NULL,
    FOREIGN KEY (member_id)
        REFERENCES garden_member (id)
        ON DELETE CASCADE
);

CREATE TABLE `garden_match` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT UNSIGNED NOT NULL,
    opponent VARCHAR(2) NULL,
    host_name VARCHAR(128) NULL,
    host_instagram BOOLEAN DEFAULT FALSE,
    host_twitter BOOLEAN DEFAULT FALSE,
    host_twitch BOOLEAN DEFAULT FALSE,
    home BOOLEAN DEFAULT FALSE,
    show_webcam BOOLEAN DEFAULT FALSE,
    show_ad_unit BOOLEAN DEFAULT FALSE,
    show_programmatic_boards BOOLEAN DEFAULT FALSE,
    show_debug_information BOOLEAN DEFAULT FALSE,
    deleted BOOLEAN DEFAULT FALSE,
    INDEX (team_id)
);

CREATE TABLE `garden_match_recap` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT UNSIGNED NOT NULL,
    member_id INT UNSIGNED NOT NULL,
    slug VARCHAR(255) NULL,
    title VARCHAR(255) NULL, 
    content TEXT NULL,
    UNIQUE INDEX(slug),
    INDEX (member_id),
    FOREIGN KEY (match_id)
        REFERENCES garden_match (id)
        ON DELETE CASCADE
);

CREATE TABLE `garden_pairing` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT UNSIGNED NOT NULL,
    member_id INT UNSIGNED NOT NULL,
    opponent_id INT UNSIGNED NOT NULL,
    result DECIMAL(2, 1) NULL,
    lichess_game_id VARCHAR(128) NULL,
    UNIQUE INDEX(match_id, member_id, opponent_id),
    INDEX(member_id),
    INDEX(opponent_id)
);

CREATE TABLE `garden_player` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT UNSIGNED NOT NULL,
    member_id INT UNSIGNED NULL,
    INDEX(match_id, member_id)
);

CREATE TABLE `garden_opponent` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT UNSIGNED NOT NULL,
    title VARCHAR(3) NULL,
    name VARCHAR(128) NULL,
    lichess_handle VARCHAR(128) NULL,
    rating SMALLINT UNSIGNED NULL,
    INDEX(match_id)
);
