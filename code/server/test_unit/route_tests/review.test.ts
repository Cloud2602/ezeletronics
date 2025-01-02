import { describe, test, expect, jest, beforeAll, afterEach, beforeEach, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { ProductReview } from '../../src/components/review';
import { Product, Category } from "../../src/components/product"
import { validationResult } from "express-validator";
import ProductDAO from "../../src/dao/productDAO";
import UserDAO from "../../src/dao/userDAO";
import { cleanup } from "../../src/db/cleanup";
import { error } from "console";
import Authenticator from "../../src/routers/auth";
import ErrorHandler from "../../src/helper";
import Test from "supertest/lib/test";
import e from "express";
import ReviewController from "../../src/controllers/reviewController";
import ReviewDAO from "../../src/dao/reviewDAO";
import { ExistingReviewError } from "../../src/errors/reviewError";
import { ProductNotFoundError } from "../../src/errors/productError";

const baseURL = "/ezelectronics"
jest.mock("../../src/controllers/productController")

const userDao = new UserDAO();
const ProductDao = new ProductDAO();
let customerSessionId: any;
let adminSessionId: any;
let managerSessionId: any;

async function createUsers() {
    await userDao.createUser("customer", "test", "test", "test", "Customer")
    await userDao.createUser("admin", "test", "test", "test", "Admin")
    await userDao.createUser("manager", "test", "test", "test", "Manager")
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
});

describe('Review tests', () => {

    test('It should return a 200 success code if a review to a product is added', async () => {
        jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(undefined);
        
        const currentDate = new Date().toISOString();

        const reviewTest = {
            model: 'model1',
            user: 'customer',
            score: 5,
            date: currentDate,
            comment: 'Great product!'
        };

        const response = await request(app).post(`${baseURL}/reviews/model1`).set('Cookie', customerSessionId).send(reviewTest);
        expect(response.status).toBe(200);
    });

    test("if user is not logged in", async () => {
        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new Error("User not logged in"));
        const currentDate = new Date().toISOString();
        const reviewTest = {
            model: 'model1',
            user: 'customer',
            score: 5,
            date: currentDate,
            comment: 'Great product!'
        };
        const response = await request(app).post(`${baseURL}/reviews/model1`).send(reviewTest);
        expect(response.status).toBe(401);
    });

    test("if user is not a customer", async () => {
        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new Error("User is not a customer"));
        const currentDate = new Date().toISOString();
        const reviewTest = {
            model: 'model1',
            user: 'admin',
            score: 5,
            date: currentDate,
            comment: 'Great product!'
        };
        const response = await request(app).post(`${baseURL}/reviews/model1`).set('Cookie', adminSessionId).send(reviewTest);
        expect(response.status).toBe(401);
    });

    test("if model is empty", async () => {
        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(undefined);
        const currentDate = new Date().toISOString();
        const reviewTest = {
            model: '',
            user: 'customer',
            score: 5,
            date: currentDate,
            comment: 'Great product!'
        };
        const response = await request(app).post(`${baseURL}/reviews/model1`).set('Cookie', customerSessionId).send(reviewTest);
        expect(response.status).toBe(422);
    });

    test("if comment is empty", async () => {
        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new Error("Comment cannot be empty"));
        const currentDate = new Date().toISOString();
        const reviewTest = {
            model: 'model1',
            user: 'customer',
            score: 5,
            date: currentDate,
            comment: ''
        };
        const response = await request(app).post(`${baseURL}/reviews/model1`).set('Cookie', customerSessionId).send(reviewTest);
        expect(response.status).toBe(422);
    });

    test("if score is not an integer", async () => {
        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new Error("Score must be an integer between 1 and 5"));
        const currentDate = new Date().toISOString();
        const reviewTest = {
            model: 'model1',
            user: 'customer',
            score: 6,
            date: currentDate,
            comment: 'Great product!'
        };
        const response = await request(app).post(`${baseURL}/reviews/model1`).set('Cookie', customerSessionId).send(reviewTest);
        expect(response.status).toBe(422);
    });

});

describe('Get reviews tests', () => {
    test('It should return a 200 success code if all reviews of a product are retrieved', async () => {
        jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce([]);
        const reviewTest = {
            model: 'model1',
            user: 'customer',
            score: 5,
            date: new Date().toISOString(),
            comment: 'Great product!'
        };

        const response = await request(app).get(`${baseURL}/reviews/model1`).set('Cookie', customerSessionId);
        expect(response.status).toBe(200);
    });

    test("if user is not logged in", async () => {
        jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValueOnce(new Error("User not logged in"));

        const reviewtest = {
            model: 'model1'
        };

        const response = await request(app).get(`${baseURL}/reviews/model1`).send(reviewtest)
        expect(response.status).toBe(401);
    });

    test("if model is empty", async () => {
        jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValueOnce(new Error("Model cannot be empty"));

        const reviewtest = {
            model: ''
        };

        const response = await request(app).get(`${baseURL}/reviews/`).set('Cookie', customerSessionId).send(reviewtest);
        expect(response.status).toBe(422);
    });

  });

  describe('Delete review tests', () => {
    test('It should return a 200 success code if a review is deleted', async () => {
        jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(undefined);
        const response = await request(app).delete(`${baseURL}/reviews/model1`).set('Cookie', customerSessionId);
        expect(response.status).toBe(200);
    });

    test("if user is not logged in", async () => {
        jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new Error("User not logged in"));
        const response = await request(app).delete(`${baseURL}/reviews/model1`);
        expect(response.status).toBe(401);
    });

    test("if user is not a customer", async () => {
        jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new Error("User is not a customer"));
        const response = await request(app).delete(`${baseURL}/reviews/model1`).set('Cookie', adminSessionId);
        expect(response.status).toBe(401);
    });

    test("if model is empty", async () => {
        jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new Error("Model cannot be empty"));
        const response = await request(app).delete(`${baseURL}/reviews/`).set('Cookie', customerSessionId);
        expect(response.status).toBe(422);
    });

  });

  describe('Delete all reviews of a product tests', () => {
    test('It should return a 200 success code if all reviews of a product are deleted', async () => {
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(undefined);
        const response = await request(app).delete(`${baseURL}/reviews/model1/all`).set('Cookie', adminSessionId);
        expect(response.status).toBe(200);
    });

    test("if user is not logged in", async () => {
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new Error("User not logged in"));
        const response = await request(app).delete(`${baseURL}/reviews/model1/all`);
        expect(response.status).toBe(401);
    });

    test("if user is not an admin or manager", async () => {
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new Error("User is not an admin or manager"));
        const response = await request(app).delete(`${baseURL}/reviews/model1/all`).set('Cookie', customerSessionId);
        expect(response.status).toBe(401);
    });

    test("if model is empty", async () => {
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new Error("Model cannot be empty"));
        const response = await request(app).delete(`${baseURL}/reviews/`).set('Cookie', adminSessionId);
        expect(response.status).toBe(422);
    });

  });



