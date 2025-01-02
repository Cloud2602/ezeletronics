import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import CartDAO from '../../src/dao/cartDAO';
import {User, Role} from '../../src/components/user';
import { Product, Category } from '../../src/components/product'
import { Cart, ProductInCart } from '../../src/components/cart'
import { 
    CartNotFoundError, 
    ProductInCartError, 
    ProductQuantityError, 
    ProductNotInCartError, 
    WrongUserCartError, 
    EmptyCartError 
  } from '../../src/errors/cartError'; 
import { ProductNotFoundError, EmptyProductStockError } from '../../src/errors/productError'
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")


test("getCart should resolve with a Cart object when the cart exists", async () => {
  const cartDAO = new CartDAO();
  const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday");
  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, { customer: user.username, paid: true, paymentDate: 'date', total: 1000 });
      return {} as Database;
  });
  const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(null, [{ model: 'model', quantity: 1, category: Category.SMARTPHONE, price: 100 }]);
      return {} as Database;
  });
  const cart = await cartDAO.getCart(user, true);
  expect(cart).toBeInstanceOf(Cart);
  expect(cart.customer).toEqual(user.username);
  expect(cart.paid).toEqual(true);
  expect(cart.paymentDate).toEqual('date');
  expect(cart.total).toEqual(1000);
  expect(cart.products).toEqual([new ProductInCart('model', 1, Category.SMARTPHONE, 100)]);
  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
});


test('getCart should reject with an error when SELECT query fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const paid = false;

  // Mock the db.get method
  const mockDBGet = jest.spyOn(db, 'get');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = ?')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.getCart(user, paid)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBGet.mockRestore();
});

test('getCart should resolve with a new Cart instance when row is null', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const paid = false;

  // Mock the db.get method
  const mockDBGet = jest.spyOn(db, 'get');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = ?')) {
      callback(null, null); // Simulate a null row
    }
    return {} as Database;
  });

  const result = await cartDAO.getCart(user, paid);
  expect(result).toBeInstanceOf(Cart);
  expect(result.customer).toBe(user.username);
  expect(result.paid).toBe(false);
  expect(result.paymentDate).toBe(null);
  expect(result.total).toBe(0);
  expect(result.products).toEqual([]);

  // Restore the mock after the test
  mockDBGet.mockRestore();
});

test('getCart should reject with an error when SELECT query for ProductsInCart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const paid = false;

  // Mock the db.get and db.all methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBAll = jest.spyOn(db, 'all');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = ?')) {
      callback(null, { cartId: 1 }); // Simulate a row with cartId
    }
    return {} as Database;
  });

  mockDBAll.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM ProductsInCart WHERE cartId = ?')) {
      callback(new Error('SQL Error (ProductsInCart)'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.getCart(user, paid)).rejects.toThrow('SQL Error (ProductsInCart)');

  // Restore the mocks after the test
  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
});

test('getCart should resolve with a new Cart instance when rows is null or empty', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const paid = false;

  // Mock the db.get and db.all methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBAll = jest.spyOn(db, 'all');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = ?')) {
      callback(null, { customer: user.username, paid: paid, paymentDate: null }); // Simulate a row
    }
    return {} as Database;
  });

  mockDBAll.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM ProductsInCart WHERE cartId = ?')) {
      callback(null, []); // Simulate null or empty rows
    }
    return {} as Database;
  });

  const result = await cartDAO.getCart(user, paid);
  expect(result).toBeInstanceOf(Cart);
  expect(result.customer).toBe(user.username);
  expect(result.paid).toBe(false);
  expect(result.paymentDate).toBe(null);
  expect(result.total).toBe(0);
  expect(result.products).toEqual([]);

  // Restore the mocks after the test
  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
});


test('addToCart should resolve with true when product is added successfully', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate'); // Fornisci i valori corretti qui
  const model = 'iPhone 13';

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Product')) {
      callback(null, { model: model, quantity: 10 });
    } else if (sql.includes('Cart')) {
      callback(null, { customer: user.username, paid: false });
    }
    return {} as Database;
  });

  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
    callback(null);
    return {} as Database;
  });

  const result = await cartDAO.addToCart(user, model);

  expect(result).toBe(true);

  mockDBGet.mockRestore();
  mockDBRun.mockRestore();
});

test('addToCart should reject with ProductNotInCartError when product does not exist', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate'); // Fornisci i valori corretti qui
  const model = 'iPhone 13';

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Product')) {
      callback(null, null);
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, model)).rejects.toThrow(ProductNotFoundError);

  mockDBGet.mockRestore();
});

test('addToCart should reject with ProductQuantityError when product quantity is 0', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate'); // Fornisci i valori corretti qui
  const model = 'iPhone 13';

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Product')) {
      callback(null, { model: model, quantity: 0 });
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, model)).rejects.toThrow(EmptyProductStockError);

  mockDBGet.mockRestore();
});


test('addToCart should reject with SQL Error when there is a database error', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const model = 'model1';

  // Mock the db.get method to simulate a database error
  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    callback(new Error('SQL Error'), null);
    return {} as any; // return a mock Database object
  });

  await expect(cartDAO.addToCart(user, model)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
});

test('addToCart should reject with ProductNotFoundError when the product does not exist', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const model = 'model1';

  // Mock the db.get method to simulate a product not found error
  const mockDBGet = jest.spyOn(db, 'get');
  mockDBGet.mockImplementation((sql, params, callback) => {
  callback(null, null);
  return {} as Database; // return a mock Database object
});

await expect(cartDAO.addToCart(user, model)).rejects.toThrow(ProductNotFoundError);

mockDBGet.mockRestore();
});

test('addToCart should reject with EmptyProductStockError when the product quantity is 0', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const model = 'model1';

  // Mock the db.get method to simulate a product with quantity 0
  const mockDBGet = jest.spyOn(db, 'get');
  mockDBGet.mockImplementation((sql, params, callback) => {
    callback(null, { quantity: 0 });
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, model)).rejects.toThrow(EmptyProductStockError);

  mockDBGet.mockRestore();
});


test('addToCart should reject with SQL Error when inserting into ProductInCart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.run method
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('INSERT INTO ProductsInCart (cartId, product, quantity) VALUES (?, ?, ?)')) {
      callback(new Error('SQL Error'));
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBRun.mockRestore();
});

test('addToCart should reject with SQL Error when updating Cart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const model = 'model1';

  // Mock the db.get and db.run methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('FROM Product')) {
      callback(null, { quantity: 1 });
    } else if (sql.includes('FROM Cart')) {
      callback(null, { cartId: 1 });
    } else {
      callback(null, { cartId: 1, model: 'model1' });
    }
    return {} as Database;
  });

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('UPDATE Cart SET total = total + ? WHERE cartId = ?')) {
      callback(new Error('SQL Error'));
    } else {
      callback(null);
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, model)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
  mockDBRun.mockRestore();
});


test('addToCart should reject with SQL Error when inserting into ProductInCart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const model = 'model1';

  // Mock the db.get and db.run methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('FROM Product')) {
      callback(null, { quantity: 1 });
    } else if (sql.includes('FROM Cart')) {
      callback(null, { cartId: 1 });
    } else {
      callback(null, null);
    }
    return {} as Database;
  });

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('INSERT INTO ProductInCart')) {
      callback(new Error('SQL Error'), null);
    } else {
      callback(null, null);
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, model)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
  mockDBRun.mockRestore();
});


test('addToCart should reject with SQL Error when updating Cart fails after inserting into ProductInCart', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const model = 'model1';

  // Mock the db.get and db.run methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('FROM Product')) {
      callback(null, { quantity: 1 });
    } else if (sql.includes('FROM Cart')) {
      callback(null, { cartId: 1 });
    } else {
      callback(null, null);
    }
    return {} as Database;
  });

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('INSERT INTO ProductInCart')) {
      callback(null);
    } else if (sql.includes('UPDATE Cart SET total = total + ? WHERE cartId = ?')) {
      callback(new Error('SQL Error'));
    } else {
      callback(null);
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, model)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
  mockDBRun.mockRestore();
});

test('addToCart should reject with an error when SELECT query fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.get method
  const mockDBGet = jest.spyOn(db, 'get');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBGet.mockRestore();
});

test('addToCart should reject with an error when INSERT INTO Cart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.run method
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('INSERT INTO Cart (customer, paid, paymentDate, total) VALUES (?, ?, ?, ?)')) {
      callback(new Error('SQL Error'));
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBRun.mockRestore();
});

test('addToCart should reject with an error when SELECT FROM ProductInCart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.get method
  const mockDBGet = jest.spyOn(db, 'get');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM ProductInCart WHERE cartId = ? AND model = ?')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBGet.mockRestore();
});

test('addToCart should reject with an error when UPDATE ProductInCart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.run method
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('UPDATE ProductInCart SET quantity = quantity + 1 WHERE cartId = ? AND model = ?')) {
      callback(new Error('SQL Error'));
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBRun.mockRestore();
});

test('addToCart should reject with an error when UPDATE Cart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.run method
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('UPDATE Cart SET total = total + ? WHERE cartId = ?')) {
      callback(new Error('SQL Error'));
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBRun.mockRestore();
});

test('addToCart should reject with an error when INSERT INTO ProductInCart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.run method
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('INSERT INTO ProductInCart (cartId, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)')) {
      callback(new Error('SQL Error'));
    }
    return {} as Database;
  });

  await expect(cartDAO.addToCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBRun.mockRestore();
});


test("checkoutCart should resolve with true when checkout is successful", async () => {
  const cartDAO = new CartDAO();
  const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday");

  // Mock db.get to return a cart and a product
  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      if (sql.includes("FROM Cart")) {
          callback(null, { customer: user.username, paid: false });
      } else if (sql.includes("FROM Product")) {
          callback(null, { model: 'model', quantity: 2 });
      }
      return {} as Database;
  });

  // Mock db.all to return a product in the cart
  const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(null, [{ model: 'model', quantity: 1, category: 'category', price: 100 }]);
      return {} as Database;
  });

  // Mock db.run to simulate successful database updates
  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
  });

  const result = await cartDAO.checkoutCart(user);
  expect(result).toEqual(true);

  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
  mockDBRun.mockRestore();
});

test('checkoutCart should reject with CartNotFoundError when cart does not exist', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate'); // Fornisci i valori corretti qui

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Cart')) {
      callback(null, null);
    }
    return {} as Database;
  });

  await expect(cartDAO.checkoutCart(user)).rejects.toThrow(CartNotFoundError);

  mockDBGet.mockRestore();
});

test('checkoutCart should reject with ProductQuantityError when product quantity in cart is more than available quantity', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Cart')) {
      callback(null, { customer: user.username, paid: false });
    } else if (sql.includes('Product')) {
      callback(null, { model: 'model', quantity: 1 });
    }
    return {} as Database;
  });

  const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
    callback(null, [{ model: 'model', quantity: 2, category: 'category', price: 100 }]);
    return {} as Database;
  });

  await expect(cartDAO.checkoutCart(user)).rejects.toThrow(ProductQuantityError);

  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
});


test('checkoutCart should reject with EmptyCartError when no products are in the cart', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Cart')) {
      callback(null, { customer: user.username, paid: false });
    }
    return {} as Database;
  });

  const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
    if (sql.includes('ProductInCart')) {
      callback(null, []);
    }
    return {} as Database;
  });

  await expect(cartDAO.checkoutCart(user)).rejects.toThrow(EmptyCartError);

  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
});

test('checkoutCart should reject with EmptyProductStockError when product quantity is zero', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Cart')) {
      callback(null, { customer: user.username, paid: false });
    } else if (sql.includes('Product')) {
      callback(null, { model: 'model', quantity: 0 }); // Simulate product with zero quantity
    } else {
      callback(null, {}); // Default case for other queries
    }
    return {} as Database;
  });

  const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
    if (sql.includes('ProductInCart')) {
      callback(null, [{ model: 'model', quantity: 1 }]); // Simulate product in cart
    }
    return {} as Database;
  });

  await expect(cartDAO.checkoutCart(user)).rejects.toThrow(EmptyProductStockError);

  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
});


test('checkout should reject with SQL Error when selecting from Cart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  // Mock the db.get method
  const mockDBGet = jest.spyOn(db, 'get');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.checkoutCart(user)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
});

test('checkout should reject with SQL Error when selecting from ProductInCart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  // Mock the db.get and db.all methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBAll = jest.spyOn(db, 'all');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(null, { cartId: 1 });
    }
    return {} as Database;
  });

  mockDBAll.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM ProductInCart WHERE cartId = ?')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.checkoutCart(user)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
});


test('checkoutCart should reject with SQL Error when selecting from Product fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  // Mock the db.get and db.all methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBAll = jest.spyOn(db, 'all');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(null, { cartId: 1 });
    } else if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  mockDBAll.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM ProductInCart WHERE cartId = ?')) {
      callback(null, [{ model: 'model1', quantity: 1 }]);
    }
    return {} as Database;
  });

  await expect(cartDAO.checkoutCart(user)).rejects.toThrow('SQL Error');

  // Restore the mocks after the test
  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
});


test('checkout should reject with ProductNotFoundError when product is not found', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  // Mock the db.get and db.all methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBAll = jest.spyOn(db, 'all');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(null, { cartId: 1 });
    } else if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(null, null); // Simulate product not found
    }
    return {} as Database;
  });

  mockDBAll.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM ProductInCart WHERE cartId = ?')) {
      callback(null, []);
    }
    return {} as Database;
  });

  await expect(cartDAO.checkoutCart(user)).rejects.toThrow(EmptyCartError);

  // Restore the mocks after the test
  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
});


test('checkout should reject with SQL Error when updating Product fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  // Mock the db.get, db.all and db.run methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBAll = jest.spyOn(db, 'all');
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(null, { cartId: 1 });
    } else if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(null, { model: 'model1', quantity: 10 });
    }
    return {} as Database;
  });

  mockDBAll.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM ProductInCart WHERE cartId = ?')) {
      callback(null, [{ model: 'model1', quantity: 1 }]);
    }
    return {} as Database;
  });

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('UPDATE Product SET quantity = quantity - ? WHERE model = ?')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.checkoutCart(user)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
  mockDBRun.mockRestore();
});

test('checkout should reject with SQL Error when updating Cart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  // Mock the db.get, db.all and db.run methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBAll = jest.spyOn(db, 'all');
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(null, { cartId: 1 });
    } else if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(null, { model: 'model1', quantity: 10 });
    }
    return {} as Database;
  });

  mockDBAll.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM ProductInCart WHERE cartId = ?')) {
      callback(null, [{ model: 'model1', quantity: 1 }]);
    }
    return {} as Database;
  });

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('UPDATE Cart SET paid = true, paymentDate = ? WHERE cartId = ?')) {
      callback(new Error('SQL Error'), null);
    } else if (sql.includes('UPDATE Product SET quantity = quantity - ? WHERE model = ?')) {
      callback(null, null);
    }
    return {} as Database;
  });

  await expect(cartDAO.checkoutCart(user)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
  mockDBAll.mockRestore();
  mockDBRun.mockRestore();
});


test('getCustomerCarts should resolve with an array of Cart objects when carts exist', async () => {
    const cartDAO = new CartDAO();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

    const mockProducts = [
        new ProductInCart('productId1', 10, Category.SMARTPHONE, 100),
        new ProductInCart('productId2', 20, Category.SMARTPHONE, 200)
    ];

    const mockCarts = [
        new Cart('username', true, 'date1', 1000, mockProducts),
        new Cart('username', true, 'date2', 2000, mockProducts)
    ];

    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        if (sql.includes('Cart')) {
        callback(null, [{customer: 'username', paid: true, paymentDate: 'date1', total: 1000}, {customer: 'username', paid: true, paymentDate: 'date2', total: 2000}]);
        }
        return {} as Database;
    });

    let callIndex = 0;

    const mockGetCart = jest.spyOn(cartDAO, 'getCart').mockImplementation(async (user, paid) => {
        const cart = mockCarts[callIndex % mockCarts.length];
        callIndex++;
        return cart || new Cart('username', true, 'defaultDate', 0, []);
    });
    
    const result = await cartDAO.getCustomerCarts(user);

    await expect(result).toEqual(mockCarts);

    mockDBAll.mockRestore();
    mockGetCart.mockRestore();
});


test('getCustomerCarts should resolve with an empty array when no carts exist', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate'); 

  const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
    if (sql.includes('Cart')) {
      callback(null, []);
    }
    return {} as Database;
  });

  const result = await cartDAO.getCustomerCarts(user);

  await expect(result).toEqual([]);

  mockDBAll.mockRestore();
});


test('getCustomersCarts should reject with SQL Error when selecting from Cart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  // Mock the db.all method
  const mockDBAll = jest.spyOn(db, 'all');

  mockDBAll.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = true')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.getCustomerCarts(user)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBAll.mockRestore();
});


test('removeProductFromCart should resolve with true when product is successfully removed', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.CUSTOMER, 'address', 'birthdate');

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Product')) {
      callback(null, { model: 'product', sellingPrice: 100 });
    } else if (sql.includes('Cart')) {
      callback(null, { customer: user.username, paid: false, cartId: 1 });
    } else if (sql.includes('ProductInCart')) {
      callback(null, { cartId: 1, model: 'product', quantity: 1 });
    }
    return {} as Database;
  });

  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
    callback(null);
    return {} as Database;
  });

  const result = await cartDAO.removeProductFromCart(user, 'product');

  await expect(result).toBe(true);

  mockDBGet.mockRestore();
  mockDBRun.mockRestore();
});


test('removeProductFromCart should reject with ProductNotFoundError when product does not exist', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.CUSTOMER, 'address', 'birthdate'); // Provide correct values here

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Product')) {
      callback(null, null);
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, 'product')).rejects.toThrow(ProductNotFoundError);

  mockDBGet.mockRestore();
});


test('removeProductFromCart should reject with CartNotFoundError when cart does not exist', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Product')) {
      callback(null, { model: 'product' });
    } else if (sql.includes('Cart')) {
      callback(null, null);
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, 'product')).rejects.toThrow(CartNotFoundError);

  mockDBGet.mockRestore();
});


test('removeProductFromCart should reject with ProductNotInCartError when product is not in the cart', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product';

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Product')) {
      callback(null, { model: product }); // Simulate product exists
    } else if (sql.includes('Cart')) {
      callback(null, { customer: user.username, paid: false }); // Simulate cart exists
    } else if (sql.includes('ProductInCart') && params.includes(product)) {
      callback(null, undefined); // Simulate product not in cart
    } else {
      callback(null, {}); // Default case for other queries
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, product)).rejects.toThrow(ProductNotInCartError);

  mockDBGet.mockRestore();
});


test('removeProductFromCart should reject with SQL Error when selecting from Product fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.get method
  const mockDBGet = jest.spyOn(db, 'get');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBGet.mockRestore();
});

test('removeProductFromCart should reject with SQL Error when selecting from Cart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.get method
  const mockDBGet = jest.spyOn(db, 'get');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(null, { model: product, quantity: 10 });
    } else if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBGet.mockRestore();
});

test('removeProductFromCart should reject with SQL Error when selecting from ProductInCart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.get method
  const mockDBGet = jest.spyOn(db, 'get');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(null, { model: product, quantity: 10 });
    } else if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(null, { cartId: 1 });
    } else if (sql.includes('SELECT * FROM ProductInCart WHERE cartId=?')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBGet.mockRestore();
});

test('removeProductFromCart should reject with EmptyCartError when cart is empty', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.get method
  const mockDBGet = jest.spyOn(db, 'get');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(null, { model: product, quantity: 10 });
    } else if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(null, { cartId: 1 });
    } else if (sql.includes('SELECT * FROM ProductInCart WHERE cartId=?')) {
      callback(null, null); // Simulate empty cart
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, product)).rejects.toThrow(new EmptyCartError());

  // Restore the mock after the test
  mockDBGet.mockRestore();
});

test('removeProductFromCart should reject with SQL Error when selecting from ProductInCart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.get and db.run methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(null, { model: product, quantity: 10, sellingPrice: 100 });
    } else if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(null, { cartId: 1 });
    } else if (sql.includes('SELECT * FROM ProductInCart WHERE cartId = ? AND model = ?')) {
      callback(new Error('SQL Error'), null);
    }
    return {} as Database;
  });

  mockDBRun.mockImplementation((sql, params, callback) => {
    callback(null);
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mocks after the test
  mockDBGet.mockRestore();
  mockDBRun.mockRestore();
});

test('removeProductFromCart should reject with ProductNotInCartError when product is not in cart', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.get method
  const mockDBGet = jest.spyOn(db, 'get');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(null, { model: product, quantity: 10, sellingPrice: 100 });
    } else if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(null, { cartId: 1 });
    } else if (sql.includes('SELECT * FROM ProductInCart WHERE cartId = ? AND model = ?')) {
      callback(null, null); // Simulate product not in cart
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, product)).rejects.toThrow(new ProductNotInCartError());

  // Restore the mock after the test
  mockDBGet.mockRestore();
});

test('removeProductFromCart should reject with SQL Error when deleting from ProductInCart or updating Cart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.get and db.run methods
  const mockDBGet = jest.spyOn(db, 'get');
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBGet.mockImplementation((sql, params, callback) => {
    if (sql.includes('SELECT * FROM Product WHERE model = ?')) {
      callback(null, { model: product, quantity: 10, sellingPrice: 100 });
    } else if (sql.includes('SELECT * FROM Cart WHERE customer = ? AND paid = false')) {
      callback(null, { cartId: 1 });
    } else if (sql.includes('SELECT * FROM ProductInCart WHERE cartId = ? AND model = ?')) {
      callback(null, { quantity: 1 }); // Simulate product in cart with quantity 1
    }
    return {} as Database;
  });

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('DELETE FROM ProductInCart WHERE cartId = ? AND model = ?') || sql.includes('UPDATE Cart SET total = total - ? WHERE cartId = ?')) {
      callback(new Error('SQL Error'));
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mocks after the test
  mockDBGet.mockRestore();
  mockDBRun.mockRestore();
});


test('removeProductFromCart should reject with an error when updating ProductInCart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.run method
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('UPDATE ProductInCart SET quantity = quantity - 1 WHERE cartId = ? AND model = ?')) {
      callback(new Error('SQL Error'));
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBRun.mockRestore();
});

test('removeProductFromCart should reject with an error when updating Cart fails', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
  const product = 'product1';

  // Mock the db.run method
  const mockDBRun = jest.spyOn(db, 'run');

  mockDBRun.mockImplementation((sql, params, callback) => {
    if (sql.includes('UPDATE Cart SET total = total - ? WHERE cartId = ?')) {
      callback(new Error('SQL Error'));
    }
    return {} as Database;
  });

  await expect(cartDAO.removeProductFromCart(user, product)).rejects.toThrow('SQL Error');

  // Restore the mock after the test
  mockDBRun.mockRestore();
});


test('clearCart should resolve with true when cart is successfully cleared', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate'); // Provide correct values here

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    if (sql.includes('Cart')) {
      callback(null, { customer: user.username, paid: false });
    }
    return {} as Database;
  });

  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
    callback(null);
    return {} as Database;
  });

  const result = await cartDAO.clearCart(user);

  await expect(result).toBe(true);

  mockDBGet.mockRestore();
  mockDBRun.mockRestore();
});


test('clearCart should reject with SQL Error', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    callback(new Error('SQL Error'), null);
    return {} as Database;
  });

  await expect(cartDAO.clearCart(user)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
});

test('clearCart should reject with CartNotFoundError', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    callback(null, undefined); // Simulate no cart found
    return {} as Database;
  });

  await expect(cartDAO.clearCart(user)).rejects.toThrow(CartNotFoundError);

  mockDBGet.mockRestore();
});

test('clearCart should reject with SQL Error when deleting from ProductInCart', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    callback(null, { customer: user.username, paid: false }); // Simulate cart exists
    return {} as Database;
  });

  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
    callback(new Error('SQL Error'));
    return {} as Database;
  });

  await expect(cartDAO.clearCart(user)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
  mockDBRun.mockRestore();
});

test('clearCart should reject with SQL Error when updating Cart', async () => {
  const cartDAO = new CartDAO();
  const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

  const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
    callback(null, { customer: user.username, paid: false }); // Simulate cart exists
    return {} as Database;
  });

  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
    if (sql.includes('UPDATE Cart')) {
      callback(new Error('SQL Error')); // Simulate SQL Error when updating Cart
    } else {
      callback(null); // Default case for other queries
    }
    return {} as Database;
  });

  await expect(cartDAO.clearCart(user)).rejects.toThrow('SQL Error');

  mockDBGet.mockRestore();
  mockDBRun.mockRestore();
});


test('getAllCarts should resolve with all carts when there are carts in the database', async () => {
  const cartDAO = new CartDAO();

  const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
    callback(null, [{ customer: 'username', paid: false }]);
    return {} as Database;
  });

  const mockGetCart = jest.spyOn(cartDAO, "getCart").mockImplementation(() => {
    return Promise.resolve(new Cart('username', false, 'defaultDate', 0, []));
  });

  const result = await cartDAO.getAllCarts();

  await expect(result).toEqual([new Cart('username', false, 'defaultDate', 0, [])]);

  mockDBAll.mockRestore();
  mockGetCart.mockRestore();
});



test('getAllCarts should resolve with an empty array when there are no carts', async () => {
  const cartDAO = new CartDAO();

  const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
    callback(null, []);
    return {} as Database;
  });

  const result = await cartDAO.getAllCarts();

  await expect(result).toEqual([]);

  mockDBAll.mockRestore();
});


test('getAllCarts should reject with an error when the database operation fails', async () => {
  const cartDAO = new CartDAO();

  const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
    callback(new Error('Database error'), null);
    return {} as Database;
  });

  await expect(cartDAO.getAllCarts()).rejects.toThrow('Database error');

  mockDBAll.mockRestore();
});


test('deleteAllCarts should resolve with true when all carts are successfully deleted', async () => {
  const cartDAO = new CartDAO();

  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
    callback(null);
    return {} as Database;
  });

  const result = await cartDAO.deleteAllCarts();

  await expect(result).toBe(true);

  mockDBRun.mockRestore();
});


test('deleteAllCarts should reject with an error when deleting from ProductInCart fails', async () => {
  const cartDAO = new CartDAO();

  let callCount = 0;
  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
    callCount++;
    if (callCount === 1) {
      callback(new Error('SQL Error')); // First DELETE operation fails
    } else if (callCount === 2) {
      callback(null); // Second DELETE operation succeeds
    }
    return {} as Database;
  });

  await expect(cartDAO.deleteAllCarts()).rejects.toThrow('SQL Error');

  mockDBRun.mockRestore();
});


test('deleteAllCarts should reject with an error when deleting from Cart fails', async () => {
  const cartDAO = new CartDAO();

  let callCount = 0;
  const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
    callCount++;
    if (callCount === 1) {
      callback(null); // First DELETE operation succeeds
    } else if (callCount === 2) {
      callback(new Error('SQL Error')); // Second DELETE operation fails
    }
    return {} as Database;
  });

  await expect(cartDAO.deleteAllCarts()).rejects.toThrow('SQL Error');

  mockDBRun.mockRestore();
});


test('lastID should throw a Method not implemented error', async () => {
  const cartDAO = new CartDAO();

  await expect(() => cartDAO.lastID('arg0', 'lastID')).toThrow('Method not implemented.');
});