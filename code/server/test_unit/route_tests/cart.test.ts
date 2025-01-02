import { describe, test, expect, jest, beforeAll, afterEach, afterAll} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import{ User, Role } from "../../src/components/user"
import { Product, Category } from '../../src/components/product'
import { Cart, ProductInCart } from '../../src/components/cart'
import CartDAO from '../../src/dao/cartDAO';
import UserDAO from '../../src/dao/userDAO';
import ProductDAO from '../../src/dao/productDAO';
import CartController from '../../src/controllers/cartController';
import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import {cleanup} from "../../src/db/cleanup"
import { beforeEach } from "node:test"
import CartRoutes from '../../src/routers/cartRoutes';
import express from 'express';
import ErrorHandler from "../../src/helper"
import { CartNotFoundError, ProductNotInCartError} from "../../src/errors/cartError"
import { ProductNotFoundError, EmptyProductStockError} from "../../src/errors/productError"
import db from "../../src/db/db"

jest.mock('../../src/controllers/cartController');

const baseURL = "/ezelectronics"


const userDao = new UserDAO();
let customerSessionId: any;
let adminSessionId: any;
let managerSessionId: any;

async function createUsers() {
    await userDao.createUser("customer", "test", "test", "test", Role.CUSTOMER)
    await userDao.createUser("admin", "test", "test", "test", Role.ADMIN)
    await userDao.createUser("manager", "test", "test", "test", Role.MANAGER)
}

beforeEach(async () => {
    await cleanup()
    await createUsers()
    jest.clearAllMocks();
    });

beforeAll(async () => {
   
        await cleanup()
        await createUsers()
        const customerResponse = await request(app).post(`${baseURL}/sessions`).send({
            username: "customer",
            password: "test"
        })

        const adminResponse = await request(app).post(`${baseURL}/sessions`).send({
            username: "admin",
            password: "test"
        })
        const managerResponse = await request(app).post(`${baseURL}/sessions`).send({
            username: "manager",
            password: "test"
        })
        customerSessionId = customerResponse.headers['set-cookie'];
        adminSessionId = adminResponse.headers['set-cookie'];
        managerSessionId = managerResponse.headers['set-cookie'];
    
});

afterEach(() => {
    jest.clearAllMocks();
});

afterAll(async () => {
    await cleanup();
    await db.close();
});



describe('GET /', () => {
    let cartId: string;

    beforeAll(async () => {
        // Create a cart
        const createResponse = await request(app)
            .post(`${baseURL}/carts/`)
            .set('Cookie', customerSessionId)
            .send({
                userId: 'someUserId', 
                items: [
                    { productId: 'product1', quantity: 2 },
                    { productId: 'product2', quantity: 1 }
                ] 
            });

        expect(createResponse.status).toBe(200); // Check that the cart was successfully created
        cartId = createResponse.body.id; // Save the cart ID for later tests
    });

    test('should return a 200 success code and the cart if the user is authenticated and is a customer', async () => {
        jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(
            new Cart('Customer1', false, '2022-01-01', 100, []));
        const getResponse = await request(app)
            .get(`${baseURL}/carts/${cartId}`) // Use the cart ID from the beforeAll block
            .set('Cookie', customerSessionId);
        

        expect(getResponse.status).toBe(200);
    });
});


describe('POST /', () => {

    test('should add a product to the cart', async () => {
        jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true); //agiungi lo spyon
        const productModel = 'testModel'; // Replace with an actual product model

        const response = await request(app)
            .post(`${baseURL}/carts`) 
            .set('Cookie', customerSessionId) 
            .send({ model: productModel });  

        
        expect(response.status).toBe(200);
    });

    test('should not add a product to the cart if user is not a customer', async () => {
        jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new EmptyProductStockError);
        const productModel = 'testModel';
        const response = await request(app)
            .post(`${baseURL}/carts`)
            .set('Cookie', adminSessionId) 
            .send(productModel);

        expect(response.status).toBe(401); 
    });

    test('should return 422 if product model is not provided', async () => {
        jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(false);
        
        const response = await request(app)
            .post(`${baseURL}/carts`)
            .set('Cookie', customerSessionId)
            .send(); // Non fornire il modello del prodotto
    
        expect(response.status).toBe(422);
        expect(response.body.error).toContain('The parameters are not formatted properly');
        expect(response.body.error).toContain('Parameter: **model** - Reason: *Invalid value* - Location: *body*');
    });

    
    test('should return 404 if product model does not exist', async () => {
        const testModel = "nonexistent_model";

        jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotFoundError());

        const response = await request(app)
            .post(`${baseURL}/carts`)
            .set('Cookie', customerSessionId)
            .send({ model: testModel });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Product not found');
    });

    
    ///CREARE PRODOTTO DI QUANTITA = 0 PRIMA
    test('should return 409 if product model\'s available quantity is 0', async () => {
        jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new EmptyProductStockError);
        const productModel = 'outOfStockModel';

        const response = await request(app)
            .post(`${baseURL}/carts`)
            .set('Cookie', customerSessionId)
            .send({ model: productModel });

        expect(response.status).toBe(409);
    });


    test('should return 401 if user is not logged in', async () => {
        jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new Error('An error occurred'));
        const productModel = 'testModel';

        const response = await request(app)
            .post(`${baseURL}/carts`)
            .send(productModel);

        expect(response.status).toBe(401);
    });
});

describe('PATCH /', () => {
    test('should checkout the cart', async () => {
        jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);
        await request(app)
            .post(`${baseURL}/carts/`)
            .set('Cookie', customerSessionId)
            .send('testModel');

        const response = await request(app)
            .patch(`${baseURL}/carts/`)
            .set('Cookie', customerSessionId);

        expect(response.status).toBe(200);
    });

    test('should not checkout the cart if user is not a customer', async () => {
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .patch(`${baseURL}/carts`)
            .set('Cookie', adminSessionId);

        expect(response.status).toBe(401);
    });

    test('should not checkout the cart if cart is empty', async () => {
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .patch(`${baseURL}/carts`)
            .set('Cookie', customerSessionId);

        expect(response.status).toBe(400);
    });

    test('should not checkout the cart if product is not available in required quantity', async () => {
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new Error('An error occurred'));
        await request(app)
            .post(`${baseURL}/carts`)
            .set('Cookie', customerSessionId)
            .send({ model: 'testModel', quantity: 100 }); // Assuming 100 is more than available

        const response = await request(app)
            .patch(`${baseURL}/carts`)
            .set('Cookie', customerSessionId);

        expect(response.status).toBe(400);
    });

    test('should return 401 if user is not logged in', async () => {
        jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .patch(`${baseURL}/carts`);

        expect(response.status).toBe(401);
    });
});

describe('GET /history', () => {
    test('should get the history of the customer\'s carts', async () => {
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([
            new Cart('Customer1', false, '2022-01-01', 100, []),
            new Cart('Customer2', true, '2022-01-02', 200, []),
        ]);
        await request(app)
            .post(`${baseURL}/carts`)
            .set('Cookie', customerSessionId)
            .send('testModel');

        await request(app)
            .patch(`${baseURL}/carts`)
            .set('Cookie', customerSessionId);

        const response = await request(app)
            .get(`${baseURL}/carts/history`)
            .set('Cookie', customerSessionId);

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    test('should not get the history if user is not a customer', async () => {
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .get(`${baseURL}/carts/history`)
            .set('Cookie', adminSessionId);

        expect(response.status).toBe(401);
    });

    test('should return 401 if user is not logged in', async () => {
        const response = await request(app)
            .get(`${baseURL}/carts/history`);

        expect(response.status).toBe(401);
    });
});

describe('DELETE /products/:model', () => {

    test('should return a 200 success code if a product is removed from the cart', async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
        const response = await request(app)
            .delete(`${baseURL}/carts/products/model1`)
            .set('Cookie', customerSessionId)
            .send({model: "model1"});

        expect(response.status).toBe(200);
    });

    test('should not remove the product if user is not a customer', async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .delete(`${baseURL}/carts/products/model1`)
            .set('Cookie', adminSessionId);

        expect(response.status).toBe(401);
    });

    test('should return 401 if user is not logged in', async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .delete(`${baseURL}/carts/products/model1`);

        expect(response.status).toBe(401);
    });

    test('should return 400 if the model is not a non-empty string', async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .delete(`${baseURL}/carts/products/mod`)
            .set('Cookie', customerSessionId);

        expect(response.status).toBe(422);
    });

    test('should return 404 if the product does not exist', async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotFoundError);
        const response = await request(app)
            .delete(`${baseURL}/carts/products/`)
            .set('Cookie', customerSessionId);

        expect(response.status).toBe(404);
    });

    
    test('should return 404 if the product is not in the current cart', async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .delete(`${baseURL}/carts/products/model2`)
            .set('Cookie', customerSessionId)
            .send({model:"model2"});

        expect(response.status).toBe(404);
    });
});

describe('DELETE /current', () => {

    test('should return a 200 success code if all products are removed from the cart', async () => {
        jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);
        const response = await request(app)
            .delete(`${baseURL}/carts/current`)
            .set('Cookie', customerSessionId);

        expect(response.status).toBe(200);
    });

    test('should not remove the products if user is not a customer', async () => {
        jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .delete(`${baseURL}/carts/current`)
            .set('Cookie', adminSessionId);

        expect(response.status).toBe(401);
    });

    test('should return 401 if user is not logged in', async () => {
        jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .delete(`${baseURL}/carts/current`);

        expect(response.status).toBe(401);
        jest.clearAllMocks();
    });

    test('should return 404 if the user does not have a current cart', async () => {
        
        jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError());
        const response = await request(app)
            .delete(`${baseURL}/carts/current`)
            .set('Cookie', customerSessionId);

        expect(response.status).toBe(404);
    });
});

describe('DELETE /', () => {

    test('should return a 200 success code if all carts are deleted', async () => {
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
        const response = await request(app)
            .delete(`${baseURL}/carts`)
            .set('Cookie', adminSessionId);

        expect(response.status).toBe(200);
    });

    test('should return a 200 success code if all carts are deleted by a manager', async () => {
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
        const deleteResponse = await request(app)
            .delete(`${baseURL}/carts`)
            .set('Cookie', managerSessionId);
    
        expect(deleteResponse.status).toBe(200);
    });

    test('should not delete the carts if user is not an admin or a manager', async () => {
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .delete(`${baseURL}/carts`)
            .set('Cookie', customerSessionId);

        expect(response.status).toBe(401);
    });

    test('should return 401 if user is not logged in', async () => {
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .delete(`${baseURL}/carts`);

        expect(response.status).toBe(401);
    });
});

describe('GET /all', () => {

    test('should return all carts if user is an admin', async () => {
        const mockCarts: Cart[] = [
            { 
                products: [], 
                customer: 'customer1', 
                paid: false, 
                paymentDate: 'date1', 
                total: 0 
            }, 
            {  
                products: [], 
                customer: 'customer2', 
                paid: false, 
                paymentDate: 'date2', 
                total: 0 
            }
        ]; 
        jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce(mockCarts);
        const response = await request(app)
            .get(`${baseURL}/carts/all`)
            .set('Cookie', adminSessionId);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('should return all carts if user is a manager', async () => {
        const mockCarts: Cart[] = [
            { 
                products: [], 
                customer: 'customer1', 
                paid: false, 
                paymentDate: 'date1', 
                total: 0 
            }, 
            {  
                products: [], 
                customer: 'customer2', 
                paid: false, 
                paymentDate: 'date2', 
                total: 0 
            }
        ]; 
        jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce(mockCarts);
        const response = await request(app)
            .get(`${baseURL}/carts/all`)
            .set('Cookie', managerSessionId);
    
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('should not return carts if user is not an admin or a manager', async () => {
        jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .get(`${baseURL}/carts/all`)
            .set('Cookie', customerSessionId);

        expect(response.status).toBe(401);
    });

    test('should return 401 if user is not logged in', async () => {
        jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValueOnce(new Error('An error occurred'));
        const response = await request(app)
            .get(`${baseURL}/carts/all`);

        expect(response.status).toBe(401);
    });
});
