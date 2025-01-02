import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { ProductAlreadyExistsError, ArrivalAfterCurrentError, InvalidInput, SellingAfterCurrentError, SellingBeforeArrivalError, EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError"
import { Category } from "../../src/components/product"
import { mock } from "node:test"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

/*********************************REGISTRER PRODUCTS******************************/
describe("Register Products", () => {
    test("Should return a message of success", async () => {
        const testModel = "test";
        const testCategory = "test";
        const testQuantity = 1;
        const testDetails = "test";
        const testSellingPrice = 200;
        const testArrivalDate = "YYYY-MM-DD";

        jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
        const controller = new ProductController();

        const response = await controller.registerProducts(testModel, testCategory, testQuantity, testDetails, testSellingPrice, testArrivalDate);
       
        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(
            testModel, testCategory, testQuantity, testDetails, testSellingPrice, testArrivalDate);
    });
});
/*********************************CHANGE PRODUCT QUANTITY******************************/
describe("Change Product Quantity", () => {
    test("Should return a message of success", async () => {
        const testModel = "test";
        const testNewQuantity = 5;
        const testChangeDate = "YYYY-MM-DD";

        jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValueOnce(testNewQuantity);
        const controller = new ProductController();

        const response = await controller.changeProductQuantity(testModel, testNewQuantity, testChangeDate);
       
        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(
            testModel, testNewQuantity, testChangeDate);
    });
});
/*********************************SELL PRODUCT******************************/
describe("Sell Product", () => {
    test("Should return a message of success", async () => {
        const testModel = "test";
        const testQuantity = 1;
        const testSellingDate = "YYYY-MM-DD";

        jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValueOnce(testQuantity);
        const controller = new ProductController();

        const response = await controller.sellProduct(testModel, testQuantity, testSellingDate);
       
        expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(
            testModel, testQuantity, testSellingDate);
    });
});
/*********************************GET PRODUCT******************************/
describe("Get Product", () => {
    test("Should return an array of products", async () => {
        const testGrouping = "test";
        const testCategory = Category.APPLIANCE;
        const testModel = "test";

        const testProduct = [{
             model : testModel,
             category : testCategory,
             quantity: 1,
             details: "test",
             sellingPrice : 200,
             arrivalDate : "YYYY-MM-DD"
        }];

        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(testProduct);
        const controller = new ProductController();

        const response = await controller.getProducts(testGrouping, testCategory, testModel);
       
        expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(
            testGrouping, testCategory, testModel);
        expect(response).toEqual(testProduct);
    });
});
/*********************************GET AVAILABLE PRODUCT******************************/
describe("Get Available Product", () => {
    test("Should return an array of products", async () => {
        const testGrouping = "test";
        const testCategory = Category.APPLIANCE;
        const testModel = "test";

        const testProduct = [{
             model : testModel,
             category : testCategory,
             quantity: 1,
             details: "test",
             sellingPrice : 200,
             arrivalDate : "YYYY-MM-DD"
        }];

        jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(testProduct);
        const controller = new ProductController();

        const response = await controller.getAvailableProducts(testGrouping, testCategory, testModel);
       
        expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(
            testGrouping, testCategory, testModel);
        expect(response).toEqual(testProduct);
    });
});
/*********************************DELETE ALL PRODUCTS******************************/
describe("Delete All Products", () => {
    test("Should return a message of success", async () => {
        jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true);
        const controller = new ProductController();

        const response = await controller.deleteAllProducts();
       
        expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
        expect(response).toEqual(true);
    });
});
/*********************************DELETE PRODUCT******************************/
describe("Delete Product", () => {
    test("Should return a message of success", async () => {
        const testModel = "test";

        jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true);
        const controller = new ProductController();

        const response = await controller.deleteProduct(testModel);
       
        expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith(testModel);
        expect(response).toEqual(true);
    });
});