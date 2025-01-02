-- SQLite

--INSERT INTO Cart (customer, paid, paymentDate, total) 
--VALUES ('Cloud', 1, '2024-05-21', 99.99);

--INSERT INTO Cart (customer, paid, paymentDate, total) 
--VALUES ('Cloud', 0, NULL, 45.50);

INSERT INTO ProductInCart (cartId, model, quantity, category, price) 
VALUES (2, 'S5', 2, 'Smartphone', 45.5);

--INSERT INTO ProductInCart (cartId, model, quantity, category, price) 
--VALUES (0, 'HpPavillon', 2, 'Laptop', 45.5);


--CREATE TABLE  Product (
--    model TEXT PRIMARY KEY,
--    sellingPrice REAL NOT NULL,
--    category TEXT NOT NULL CHECK(category IN ('Smartphone', 'Laptop', 'Appliance')),
--    arrivalDate DATE,
--    details TEXT,
--    quantity INTEGER NOT NULL
--);


--CREATE TABLE  Cart (
--    cartId INTEGER PRIMARY KEY AUTOINCREMENT,
--    customer TEXT NOT NULL,
--    paid BOOLEAN NOT NULL,
--    paymentDate DATE,
--    total REAL NOT NULL,
--    FOREIGN KEY (customer) REFERENCES User(username)
--);



--CREATE TABLE IF NOT EXISTS ProductInCart (
--    cartId INTEGER NOT NULL,
--    model TEXT NOT NULL,
--    quantity INTEGER NOT NULL,
--    category TEXT NOT NULL CHECK(category IN ('Smartphone', 'Laptop', 'Appliance')),
--    price REAL NOT NULL,
--    PRIMARY KEY (cartId, model),
--    FOREIGN KEY (cartId) REFERENCES Cart(id),
--    FOREIGN KEY (model) REFERENCES Product(model)
--);


--CREATE TABLE IF NOT EXISTS ProductReview (
--    model TEXT NOT NULL,
  --  user TEXT NOT NULL,
    --score INTEGER NOT NULL,
    --date DATE NOT NULL,
    --comment TEXT,
    --PRIMARY KEY (model, user),
--    FOREIGN KEY (model) REFERENCES Product(model),
  --  FOREIGN KEY (user) REFERENCES User(username)
--);
