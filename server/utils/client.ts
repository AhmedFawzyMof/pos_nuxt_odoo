import Odoo from "odoo-await";

export const connectToOdoo = (username: string, password: string) => {
  return new Odoo({
    baseUrl: process.env.DEFAULT_URL!,
    db: process.env.DEFAULT_DB!,
    username: username,
    password: password,
  });
};
