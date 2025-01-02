import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import CartDAO from '../../src/dao/cartDAO';
import CartController from '../../src/controllers/cartController';
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
jest.mock('../../src/dao/cartDAO');

test('addToCart should add a new product to the cart', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
    const product = 'product1';

    const mockAddToCart = jest.spyOn(CartDAO.prototype, 'addToCart');
    mockAddToCart.mockResolvedValue(true);

    const result = await cartController.addToCart(user, product);
    expect(result).toBe(true);

    expect(mockAddToCart).toHaveBeenCalledWith(user, product);

    mockAddToCart.mockRestore();
});

test('addToCart should handle errors', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
    const product = 'product1';

    const mockAddToCart = jest.spyOn(CartDAO.prototype, 'addToCart');
    mockAddToCart.mockRejectedValue(new Error('Test error'));

    await expect(cartController.addToCart(user, product)).rejects.toThrow('Test error');

    expect(mockAddToCart).toHaveBeenCalledWith(user, product);

    mockAddToCart.mockRestore();
});


test('getCart should retrieve the current cart for a specific user', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
    const cart = new Cart(user.username, false, 'date1', 0, []);

    const mockGetCart = jest.spyOn(CartDAO.prototype, 'getCart');
    mockGetCart.mockResolvedValue(cart);

    const result = await cartController.getCart(user);
    expect(result).toEqual(cart);

    expect(mockGetCart).toHaveBeenCalledWith(user, false);

    mockGetCart.mockRestore();
});

test('getCart should return an empty cart if there is no current cart for the user', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
    const cart = new Cart(user.username, false, 'date1', 0, []);

    const mockGetCart = jest.spyOn(CartDAO.prototype, 'getCart');
    mockGetCart.mockResolvedValue(cart);

    const result = await cartController.getCart(user);
    expect(result).toEqual(cart);
    expect(result.products.length).toBe(0);

    expect(mockGetCart).toHaveBeenCalledWith(user, false);

    mockGetCart.mockRestore();
});


test('checkoutCart should checkout the user\'s cart', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

    const mockCheckoutCart = jest.spyOn(CartDAO.prototype, 'checkoutCart');
    mockCheckoutCart.mockResolvedValue(true);

    const result = await cartController.checkoutCart(user);
    expect(result).toBe(true);

    expect(mockCheckoutCart).toHaveBeenCalledWith(user);

    mockCheckoutCart.mockRestore();
});

test('checkoutCart should handle errors', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

    const mockCheckoutCart = jest.spyOn(CartDAO.prototype, 'checkoutCart');
    mockCheckoutCart.mockRejectedValue(new Error('Test error'));

    await expect(cartController.checkoutCart(user)).rejects.toThrow('Test error');

    expect(mockCheckoutCart).toHaveBeenCalledWith(user);

    mockCheckoutCart.mockRestore();
});


test('getCustomerCarts should retrieve all paid carts for a specific customer', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
    const carts = [
        new Cart(user.username, true, '2022-01-01', 100, []),
        new Cart(user.username, true, '2022-02-01', 200, [])
    ];

    const mockGetCustomerCarts = jest.spyOn(CartDAO.prototype, 'getCustomerCarts');
    mockGetCustomerCarts.mockResolvedValue(carts);

    const result = await cartController.getCustomerCarts(user);
    expect(result).toEqual(carts);

    expect(mockGetCustomerCarts).toHaveBeenCalledWith(user);

    mockGetCustomerCarts.mockRestore();
});

test('getCustomerCarts should handle errors', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

    const mockGetCustomerCarts = jest.spyOn(CartDAO.prototype, 'getCustomerCarts');
    mockGetCustomerCarts.mockRejectedValue(new Error('Test error'));

    await expect(cartController.getCustomerCarts(user)).rejects.toThrow('Test error');

    expect(mockGetCustomerCarts).toHaveBeenCalledWith(user);

    mockGetCustomerCarts.mockRestore();
});


test('removeProductFromCart should remove one product unit from the current cart', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
    const product = 'product1';

    const mockRemoveProductFromCart = jest.spyOn(CartDAO.prototype, 'removeProductFromCart');
    mockRemoveProductFromCart.mockResolvedValue(true);

    const result = await cartController.removeProductFromCart(user, product);
    expect(result).toBe(true);

    expect(mockRemoveProductFromCart).toHaveBeenCalledWith(user, product);

    mockRemoveProductFromCart.mockRestore();
});

test('removeProductFromCart should handle errors', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');
    const product = 'product1';

    const mockRemoveProductFromCart = jest.spyOn(CartDAO.prototype, 'removeProductFromCart');
    mockRemoveProductFromCart.mockRejectedValue(new Error('Test error'));

    await expect(cartController.removeProductFromCart(user, product)).rejects.toThrow('Test error');

    expect(mockRemoveProductFromCart).toHaveBeenCalledWith(user, product);

    mockRemoveProductFromCart.mockRestore();
});


test('clearCart should remove all products from the current cart', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

    const mockClearCart = jest.spyOn(CartDAO.prototype, 'clearCart');
    mockClearCart.mockResolvedValue(true);

    const result = await cartController.clearCart(user);
    expect(result).toBe(true);

    expect(mockClearCart).toHaveBeenCalledWith(user);

    mockClearCart.mockRestore();
});

test('clearCart should handle errors', async () => {
    const cartController = new CartController();
    const user = new User('username', 'name', 'surname', Role.ADMIN, 'address', 'birthdate');

    const mockClearCart = jest.spyOn(CartDAO.prototype, 'clearCart');
    mockClearCart.mockRejectedValue(new Error('Test error'));

    await expect(cartController.clearCart(user)).rejects.toThrow('Test error');

    expect(mockClearCart).toHaveBeenCalledWith(user);

    mockClearCart.mockRestore();
});


test('deleteAllCarts should delete all carts of all users', async () => {
    const cartController = new CartController();

    const mockDeleteAllCarts = jest.spyOn(CartDAO.prototype, 'deleteAllCarts');
    mockDeleteAllCarts.mockResolvedValue(true);

    const result = await cartController.deleteAllCarts();
    expect(result).toBe(true);

    expect(mockDeleteAllCarts).toHaveBeenCalled();

    mockDeleteAllCarts.mockRestore();
});

test('deleteAllCarts should handle errors', async () => {
    const cartController = new CartController();

    const mockDeleteAllCarts = jest.spyOn(CartDAO.prototype, 'deleteAllCarts');
    mockDeleteAllCarts.mockRejectedValue(new Error('Test error'));

    await expect(cartController.deleteAllCarts()).rejects.toThrow('Test error');

    expect(mockDeleteAllCarts).toHaveBeenCalled();

    mockDeleteAllCarts.mockRestore();
});


test('getAllCarts should retrieve all carts in the database', async () => {
    const cartController = new CartController();
    const user1 = new User('username1', 'name1', 'surname1', Role.ADMIN, 'address1', 'birthdate1');
    const user2 = new User('username2', 'name2', 'surname2', Role.ADMIN, 'address2', 'birthdate2');
    const carts = [
        new Cart(user1.username, true, '2022-01-01', 100, []),
        new Cart(user2.username, true, '2022-02-01', 200, [])
    ];

    const mockGetAllCarts = jest.spyOn(CartDAO.prototype, 'getAllCarts');
    mockGetAllCarts.mockResolvedValue(carts);

    const result = await cartController.getAllCarts();
    expect(result).toEqual(carts);

    expect(mockGetAllCarts).toHaveBeenCalled();

    mockGetAllCarts.mockRestore();
});

test('getAllCarts should handle errors', async () => {
    const cartController = new CartController();

    const mockGetAllCarts = jest.spyOn(CartDAO.prototype, 'getAllCarts');
    mockGetAllCarts.mockRejectedValue(new Error('Test error'));

    await expect(cartController.getAllCarts()).rejects.toThrow('Test error');

    expect(mockGetAllCarts).toHaveBeenCalled();

    mockGetAllCarts.mockRestore();
});