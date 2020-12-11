/*
CREATE TABLE `garden_manager` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NULL,
    email VARCHAR(255) NULL,
    password VARCHAR(255) NULL,
    deleted BOOLEAN DEFAULT FALSE
);
*/

import Model from '../model';
import {FIELD_TYPE} from '../mysql/manager';

const schema = {
  id: FIELD_TYPE.ID,
  name: FIELD_TYPE.VARIABLE,
  email: FIELD_TYPE.VARIABLE,
  password: FIELD_TYPE.VARIABLE,
  deleted: FIELD_TYPE.BOOLEAN
};
Object.freeze(schema);

/**
 *
 * @param {Sequelize} sequelize
 */
class Manager extends Model {
  schema
}

Manager.schema = schema;
Object.freeze(Manager);

export default Manager;
