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
describe("Registrer Products", () => {
    test("Should return a message of success", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database;
          });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const result = await productDAO.registerProducts("test", Category.SMARTPHONE, 1, "", 200, "");
        expect(result).toBe(undefined)

        mockDBRun.mockRestore();
        mockDBGet.mockRestore();
    })

    test("Should return a message of error if ProductAlreadyExistsError is thrown", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {model : "test"})
            return {} as Database;
          });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("UNIQUE constraint failed: products.model"), null);
            return {} as Database;
        });
        await expect(productDAO.registerProducts("test", Category.SMARTPHONE, 1, "", 200, "")).rejects.toThrow(ProductAlreadyExistsError);

        mockDBRun.mockRestore();
        mockDBGet.mockRestore();
    })

    test("Should return a message of error if InvalidInput is thrown", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database;
          });

        await expect(productDAO.registerProducts("", "test", 1, "test", 1, "YYYY-MM-DD")).rejects.toThrow(InvalidInput);
        await expect(productDAO.registerProducts("test", "", 1, "test", 1, "YYYY-MM-DD")).rejects.toThrow(InvalidInput);
        await expect(productDAO.registerProducts("test", "test", 0, "test", 1, "YYYY-MM-DD")).rejects.toThrow(InvalidInput);
        await expect(productDAO.registerProducts("test", "test", 1, "test", 0, "YYYY-MM-DD")).rejects.toThrow(InvalidInput);

        mockDBGet.mockRestore();
    })

    test("Should return a message of error if ArrivalAfterCurrentError is thrown", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database;
          });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
        await expect(productDAO.registerProducts("S5", Category.SMARTPHONE, 1, null, 200, "2030-01-01"))
        .rejects.toThrow(ArrivalAfterCurrentError);

        mockDBRun.mockRestore();
        mockDBGet.mockRestore();
    })

    test("DB Error", async () => {
        const productDAO = new ProductDAO()

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database;
          });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB error")
        });
        try{
            await productDAO.registerProducts("S5", Category.SMARTPHONE, 1, null, 200, null)
        } catch (error) {
            expect(error.message).toBe("DB error")
        } finally {
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        }
    });

    test("Error in get query", async () => {
        const productDAO = new ProductDAO()

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Error in Select"), null);
            return {} as Database;
        });

        await expect(productDAO.registerProducts("S5", Category.SMARTPHONE, 1, null, 200, null)).rejects.toThrow(new Error("Error in Select"))
        
        mockDBGet.mockRestore()
    });

    test("Error in run query", async () => {

        const productDAO = new ProductDAO()

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Error in Insert Into"), null);
            return {} as Database;
        });

        await expect(productDAO.registerProducts("S5", Category.SMARTPHONE, 1, null, 200, null)).rejects.toThrow(new Error("Error in Insert Into"))

        mockDBGet.mockRestore()
        mockDBRun.mockRestore()

    });
})

/*********************************CHANGE PRODUCT QUANTITY******************************/
describe("Change product Quantity", () => {
    test("Should return a message of success", async () => {
        const productDAO = new ProductDAO();

        const model = "model";
        const newQuantity = 5;
        const changeDate = "2024-01-01"

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {arrivalDate: "2023-01-01"})
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

    const result = await productDAO.changeProductQuantity(model, newQuantity, changeDate);
    expect(result).toEqual(newQuantity);

    mockDBRun.mockRestore();
    mockDBGet.mockRestore();
    })

    test("Should return a message of error if ProductNotFoundError is thrown", async () => {
        const productDAO = new ProductDAO();

        const model = "model";
        const newQuantity = 5;
        const changeDate = "2024-01-01"

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        });

        await expect(productDAO.changeProductQuantity(model, newQuantity, changeDate)).rejects.toThrow(ProductNotFoundError);

        mockDBGet.mockRestore();

    })

    test("Should return a message of error if ChangeDate is after CurrentDate", async () => {
        const productDAO = new ProductDAO();

        const model = "model";
        const newQuantity = 5;
        const currentDate = new Date().toISOString().split('T')[0]
        const futureDate = new Date(currentDate);

        futureDate.setDate(futureDate.getDate() + 1); // Set the changeDate to be one day in the future
        const changeDate = futureDate.toISOString().split('T')[0];

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { arrival_date: "2023-01-01" })
            return {} as Database
        });

        await expect(productDAO.changeProductQuantity(model, newQuantity, changeDate)).rejects.toThrow(new Error('The change date cannot be after the current date'));

        mockDBGet.mockRestore();

    })
    
    test("Should return a message of error if ChangeDate is before ArrivalDate", async () => {
        const productDAO = new ProductDAO();

        const model = "model";
        const newQuantity = 5;
        const changeDate = "2023-01-01"

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error('The change date cannot be before the arrival date'), {arrivalDate: "2024-01-01"})
            return {} as Database
        });

        await expect(productDAO.changeProductQuantity(model, newQuantity, changeDate))
        .rejects.toThrow(Error('The change date cannot be before the arrival date'));

        mockDBGet.mockRestore();
    })
    
    test("Error in get query", async () => {
        const productDAO = new ProductDAO();

        const model = "model";
        const newQuantity = 5;
        const changeDate = "2000-01-01"
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Error SELECT"), null)
            return {} as Database
        });

        await expect(productDAO.changeProductQuantity(model, newQuantity, changeDate)).rejects.toThrow(new Error("Error SELECT"));

        mockDBGet.mockRestore()
    });

    test("It should reject if there is an error in the query", async () => {
        const productDAO = new ProductDAO()

        const model = "model";
        const newQuantity = 5;
        const changeDate = "2000-01-01"
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, "")
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error(), null)
            return {} as Database
        });

        await expect(productDAO.changeProductQuantity(model, newQuantity, changeDate)).rejects.toThrow(new Error)

        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    })
})
/*********************************SELL PRODUCT******************************/
describe("Sell Product", () => {
    test("Should return a message of success", async () => {
        const productDAO = new ProductDAO();

        const model = "model";
        const quantity = 2;
        const sellingDate = "2024-01-01";

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, [{arrivalDate: "2023-01-01", quantity: 5}]);
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
    const result = await productDAO.sellProduct(model, quantity, sellingDate);
    expect(result).toEqual(quantity)

    mockDBRun.mockRestore();
    mockDBGet.mockRestore();
    })

    test("Should return a message of error if SellingDate is after CurrentDate", async() =>{
        const productDAO = new ProductDAO();

        const model = "model";
        const quantity = 2;

        const currentDate = new Date().toISOString().split('T')[0]
        const futureDate = new Date(currentDate);

        futureDate.setDate(futureDate.getDate() + 1); // Set the changeDate to be one day in the future
        const sellingDate = futureDate.toISOString().split('T')[0];

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        await expect(productDAO.sellProduct(model, quantity, sellingDate))
        .rejects.toThrow(SellingAfterCurrentError);

        mockDBGet.mockRestore();

    })

    test("Should return an error if model does not represent a product in the database", async() => {

        const productDAO = new ProductDAO();

        const model = "model";
        const quantity = 2;
        const sellingDate = "2022-01-01";
    
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(ProductNotFoundError, null); // mock the product as not found in the database
            return {} as Database;
        });
    
        await expect(productDAO.sellProduct(model, quantity, sellingDate)).rejects.toThrow(ProductNotFoundError);
        mockDBGet.mockRestore();
    })

    test("Should return a message of error if SellingDate is before ArrivalDate", async() =>{
        const productDAO = new ProductDAO();

        const model = "model";
        const quantity = 2;
        const sellingDate = "2023-01-01";

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(SellingBeforeArrivalError, {arrivalDate: "2024-01-01", quantity: 5});
            return {} as Database;
        });

        await expect(productDAO.sellProduct(model, quantity, sellingDate)).rejects.toThrow(SellingBeforeArrivalError);
        mockDBGet.mockRestore();
    })

    test("Should return a message of error if quantity of product is 0", async() =>{
        const productDAO = new ProductDAO();

        const model = "model";
        const quantity = 2;
        const sellingDate = "2024-01-01";

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(EmptyProductStockError, {arrivalDate: "2024-01-02", quantity: 0});
            return {} as Database;
        });

        await expect(productDAO.sellProduct(model, quantity, sellingDate)).rejects.toThrow(EmptyProductStockError);
        mockDBGet.mockRestore();
    })

    test("Should return a message of error if requested quantity of product is greater than available quantity", async() => {
        const productDAO = new ProductDAO();

        const model = "model";
        const quantity = 2;
        const sellingDate = "2024-01-01";

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(LowProductStockError, {arrivalDate: "2024-01-02", quantity: 1});
            return {} as Database;
        });

        await expect(productDAO.sellProduct(model, quantity, sellingDate)).rejects.toThrow(LowProductStockError);

        mockDBGet.mockRestore();
    })

    test("It should reject if there is an error in the query", async () => {
        const productDAO = new ProductDAO()

        const model = "model";
        const quantity = 2;
        const sellingDate = "2024-01-01";
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, "")
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error(), null)
            return {} as Database
        });

        await expect(productDAO.sellProduct(model, quantity, sellingDate)).rejects.toThrow(new Error)

        mockDBGet.mockRestore()
        mockDBRun.mockRestore()
    })
})
/*********************************GET PRODUCTS******************************/
describe("Get Products", () => {
    test("Should return all products if grouping is null and category and model are null", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [{model: "test", sellingPrice : 200, category: "", arrivalDate: "2023-01-02", details: "test", quantity: 2}]);
            return {} as Database;
        });

        expect(await productDAO.getProducts(null, null, null)).toEqual([{model: "test", sellingPrice : 200, category: "", arrivalDate: "2023-01-02", details: "test", quantity: 2}]);

        mockDBGet.mockRestore();
        mockDBAll.mockRestore();
    });

    test("Should return all products if grouping of one category is category and category is not null", async() =>{

        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [{model: "test", sellingPrice : 200, category: Category.SMARTPHONE, arrivalDate: "2023-01-02", details: "test", quantity: 2}]);
            return {} as Database;
        });

        expect(await productDAO.getProducts("category", Category.SMARTPHONE, null)).toEqual([{model: "test", sellingPrice : 200, category: Category.SMARTPHONE, arrivalDate: "2023-01-02", details: "test", quantity: 2}]);

        mockDBGet.mockRestore();
        mockDBAll.mockRestore();
    })

    test("Should return all products if grouping is model and model is not null", async() =>{

        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [{model: "test", sellingPrice : 200, category: "", arrivalDate: "2023-01-02", details: "test", quantity: 2}]);
            return {} as Database;
        });

        expect(await productDAO.getProducts("model", null, "model"))
        .toEqual([{model: "test", sellingPrice : 200, category: "", arrivalDate: "2023-01-02", details: "test", quantity: 2}]);

        mockDBGet.mockRestore();
        mockDBAll.mockRestore();
    })
    test("Should return error if grouping is null and any of category or model is not null", async() => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
        
        await expect(productDAO.getProducts(null, "test", null)).rejects
        .toThrow(new Error('Grouping is null and either category or model is not null'));

        await expect(productDAO.getProducts(null, null, "test")).rejects
        .toThrow(new Error('Grouping is null and either category or model is not null'));

        mockDBGet.mockRestore();
    })

    test("Should return error if grouping is category and category is null or model is not null", async() => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(productDAO.getProducts("category", null, null)).rejects.
        toThrow(new Error('Grouping is category and category is null or model is not null'));

        await expect(productDAO.getProducts("category", "test", "test")).rejects.
        toThrow(new Error('Grouping is category and category is null or model is not null'));

        mockDBGet.mockRestore();
    })

    test("Should return error if grouping is model and model is null or category is not null", async() => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(productDAO.getProducts("model", "test", "test")).rejects.
        toThrow(new Error('Grouping is model and model is null or category is not null'));
        await expect(productDAO.getProducts("model", null, null)).rejects.
        toThrow(new Error('Grouping is model and model is null or category is not null'));

        mockDBGet.mockRestore();
    })

    test("Should return an error if model does not represent a product in the database (only when grouping is model)", async() => {
        const productDAO = new ProductDAO();
    
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(ProductNotFoundError, null); // mock the product as not found in the database
            return {} as Database;
        });
    
        await expect(productDAO.getProducts("model", null, "noExistingModel")).rejects.toThrow(ProductNotFoundError);
    
        mockDBGet.mockRestore();
    })

    test("It should reject if there is an error in the product query", async () => {

        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(new Error(), null);
            return {} as Database;
        });

        await expect(productDAO.getProducts(null, null, null)).rejects.toThrow(new Error());

        mockDBGet.mockRestore();
        mockDBAll.mockRestore();
    })
})
/*********************************GET AVAILABLE PRODUCTS******************************/
describe("Get Available Products", () => {
    test("Should return all products if grouping is null and category and model are null", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [{model: "test", sellingPrice : 200, category: "", arrivalDate: "2023-01-02", details: "test", quantity: 2}]);
            return {} as Database;
        });

        expect(await productDAO.getAvailableProducts(null, null, null))
        .toEqual([{model: "test", sellingPrice : 200, category: "", arrivalDate: "2023-01-02", details: "test", quantity: 2}]);

        mockDBGet.mockRestore();
        mockDBAll.mockRestore();
    });

    test("Should return all products if grouping of one category is category and category is not null", async() =>{

        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [{model: "test", sellingPrice : 200, category: Category.SMARTPHONE, arrivalDate: "2023-01-02", details: "test", quantity: 2}]);
            return {} as Database;
        });

        expect(await productDAO.getAvailableProducts("category", Category.SMARTPHONE, null))
        .toEqual([{model: "test", sellingPrice : 200, category: Category.SMARTPHONE, arrivalDate: "2023-01-02", details: "test", quantity: 2}]);

        mockDBGet.mockRestore();
        mockDBAll.mockRestore();
    })

    test("Should return all products if grouping is model and model is not null", async() =>{

        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [{model: "test", sellingPrice : 200, category: "", arrivalDate: "2023-01-02", details: "test", quantity: 2}]);
            return {} as Database;
        });

        expect(await productDAO.getAvailableProducts("model", null, "model"))
        .toEqual([{model: "test", sellingPrice : 200, category: "", arrivalDate: "2023-01-02", details: "test", quantity: 2}]);

        mockDBGet.mockRestore();
        mockDBAll.mockRestore();
    })
    test("Should return error if grouping is null and any of category or model is not null", async() => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
        
        await expect(productDAO.getAvailableProducts(null, "test", null)).rejects
        .toThrow(new Error('Grouping is null and either category or model is not null'));

        await expect(productDAO.getAvailableProducts(null, null, "test")).rejects
        .toThrow(new Error('Grouping is null and either category or model is not null'));

        mockDBGet.mockRestore();
    })

    test("Should return error if grouping is category and category is null or model is not null", async() => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProducts("category", null, null)).rejects.
        toThrow(new Error('Grouping is category and category is null or model is not null'));

        await expect(productDAO.getAvailableProducts("category", "test", "test")).rejects.
        toThrow(new Error('Grouping is category and category is null or model is not null'));

        mockDBGet.mockRestore();
    })

    test("Should return error if grouping is model and model is null or category is not null", async() => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProducts("model", "test", "test")).rejects.
        toThrow(new Error('Grouping is model and model is null or category is not null'));
        await expect(productDAO.getAvailableProducts("model", null, null)).rejects.
        toThrow(new Error('Grouping is model and model is null or category is not null'));

        mockDBGet.mockRestore();
    })

    test("Should return an error if model does not represent a product in the database (only when grouping is model)", async() => {
        const productDAO = new ProductDAO();
    
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(ProductNotFoundError, null); // mock the product as not found in the database
            return {} as Database;
        });
    
        await expect(productDAO.getAvailableProducts("model", null, "noExistingModel")).rejects.toThrow(ProductNotFoundError);
    
        mockDBGet.mockRestore();
    })

    test("It should reject if there is an error in the product query", async () => {

        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(new Error(), null);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProducts(null, null, null)).rejects.toThrow(new Error());

        mockDBGet.mockRestore();
        mockDBAll.mockRestore();
    })
})
/*********************************DELETE ALL PRODUCT******************************/
describe("Delete All Products", () => {
    test("Should delete all products from the database", async () => {
        const productDAO = new ProductDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback(null, {changes: 5}); // mock the deletion of all products
            return {} as Database;
        });

        const result = await productDAO.deleteAllProducts();
        expect(result).toBe(true);

        mockDBRun.mockRestore();
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const productDAO = new ProductDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error, null);
            return {} as Database;
        });

        await expect(productDAO.deleteAllProducts()).rejects.toThrow(Error);

        mockDBRun.mockRestore();
    });
});
/*********************************DELETE PRODUCT******************************/
describe("Delete Product", () => {
    test("Should delete a product if model exists in the database", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {model: "model"});
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null, {changes: 1}); // mock the deletion of the product
            return {} as Database;
        }); 

        const result = await productDAO.deleteProduct("model"); 
        expect(result).toBe(true);

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("Should return a 404 error if model does not represent a product in the database", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(ProductNotFoundError, null);
            return {} as Database;
        });

        await expect(productDAO.deleteProduct("model")).rejects.toThrow(ProductNotFoundError);

        mockDBGet.mockRestore();
    });

    test("It should reject with an error if there is an error in the database query", async () => {
        const productDAO = new ProductDAO();

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {model: "model"});
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error, null);
            return {} as Database;
        });

        await expect(productDAO.deleteProduct("model")).rejects.toThrow(Error);

        mockDBRun.mockRestore();
    });
});



