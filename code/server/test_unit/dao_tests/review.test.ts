import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import ReviewDAO from "../../src/dao/reviewDAO"
import { User } from "../../src/components/user"
import { Role } from "../../src/components/user"
import { ProductNotFoundError } from "../../src/errors/productError"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"

import { afterEach } from "@jest/globals"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

//Example of unit test for the addReview method
//It mocks the database run method to simulate a successful insertion
//It then calls the addReview method and expects it to resolve to void
afterEach(() => {
    jest.clearAllMocks();
})



describe("addReview", () => {

    
test("It should resolve to void", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const result = await reviewDAO.addReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday" ), 1, "date")
    expect(result).toBeUndefined()
    mockDBRun.mockRestore()
});


//Example of unit test for the error ProductNotFoundError in the addReview method

test("It should reject with ProductNotFoundError", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, null)
        return {} as Database
    });
    try {
        await reviewDAO.addReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday" ), 1, "date")
    } catch (error) {
        expect(error).toBeInstanceOf(ProductNotFoundError)
    }
    mockDBGet.mockRestore()
});

//Example of unit test for the error ExistingReviewError in the addReview method

test("It should reject with ExistingReviewError", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, {})
        return {} as Database
    });
    try {
        await reviewDAO.addReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday" ), 1, "date")
    } catch (error) {
        expect(error).toBeInstanceOf(ExistingReviewError)
    }
    mockDBGet.mockRestore()
});

//Example of unit test for reject(error) in the addReview method

test("It should reject with error", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(new Error())
        return {} as Database
    });
    try {
        await reviewDAO.addReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday" ), 1, "date")
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
    }
    mockDBGet.mockRestore()
});

//Unit test for addReview DB crashed
test( "Add review - DB Crashed", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        throw new Error("DB Crashed");
    });
    try{
        await reviewDAO.addReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday" ), 1, "date")
    }
    catch(e){
        expect(e.message).toBe("DB Crashed")
    }
    finally{
    mockDBRun.mockRestore()
    }
});

//DB Error in addReview
test("DB Error in addReview", async () => {
    const reviewDAO = new ReviewDAO()
    const error = new Error("DB Error");
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(error)
        return {} as Database
    });
        expect(reviewDAO.addReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday" ), 1, "date")).rejects.toBe(error)
   
        mockDBRun.mockRestore()
});

});

//Example of unit test for the getProductReviews method

test("It should return an array of reviews", async () => {
    const reviewDAO = new ReviewDAO()
    const testModel = "test"
    const testReview = [{
        model: testModel,
        user: new User("test", "test", "test", Role.CUSTOMER, "test", "test"),
        score: 1,
        date: "2022-01-01",
        comment: "Great product!"
    }]
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, testReview)
        return {} as Database
    });
    const result = await reviewDAO.getProductReviews(testModel) as any
    expect(result).toEqual(testReview)
    mockDBAll.mockRestore()
});

//Unit test for getProductReview DB Crashed

test("returnReviews should return all reviews for a product from the database", async () => {
    const reviewDAO = new ReviewDAO();

    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{}, {}])
        return {} as Database
    });

    const result = await reviewDAO.getProductReviews('model1');
    expect(result).toEqual([{}, {}]);

    expect(mockDBAll).toHaveBeenCalledTimes(1);
    expect(mockDBAll).toHaveBeenCalledWith(
        'SELECT * FROM ProductReview WHERE model = ?',
        ['model1'],
        expect.any(Function)
    );
});


//Example of unit test for the reject(error) in the getProductReviews method

test("It should reject with error", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(new Error())
        return {} as Database
    });
    try {
        await reviewDAO.getProductReviews("model")
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
    }
    mockDBAll.mockRestore()
});

//Example of unit test for the deleteReview method

describe("deleteReview", () => {


    test("It should resolve to void", async () => {
        const reviewDAO = new ReviewDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const result = await reviewDAO.deleteReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday"))
        expect(result).toBeUndefined()
        mockDBRun.mockRestore()
});

//Example of unit test for the reject(error) in the deleteReview method

test("It should reject with error", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(new Error())
        return {} as Database
    });
    try {
        await reviewDAO.deleteReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday"))
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
    }
    mockDBGet.mockRestore()
});


//Example of unit test for the error ProductNotFoundError in the deleteReview method

test("It should reject with ProductNotFoundError", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, null)
        return {} as Database
    });
    try {
        await reviewDAO.deleteReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday"))
    } catch (error) {
        expect(error).toBeInstanceOf(ProductNotFoundError)
    }
    mockDBGet.mockRestore()
});

//Example of unit test for the error ExistingReviewError in the deleteReview method

test("It should reject with ExistingReviewError", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, {})
        return {} as Database
    });
    try {
        await reviewDAO.deleteReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday"))
    } catch (error) {
        expect(error).toBeInstanceOf(ExistingReviewError)
    }
    mockDBGet.mockRestore()
});

//Unit test for deleteReview DB Crashed
test("Delete review - DB Crashed", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        throw new Error("DB Crashed");
    });
    try{
        await reviewDAO.deleteReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday"))
    }
    catch(e){
        expect(e.message).toBe("DB Crashed")
    }
    
    mockDBRun.mockRestore()
    
});

//DB Error in deleteReview
test("DB Error in deleteReview", async () => {
    const reviewDAO = new ReviewDAO()
    const error = new Error("DB Error");
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(error)
        return {} as Database
    });
        expect(reviewDAO.deleteReview("model", new User("username", "name", "surname", Role.CUSTOMER, "address", "birthday"))).rejects.toBe(error)
   
        mockDBRun.mockRestore()
});

});

//Example of unit test for the deleteReviewsOfProduct method

test("It should resolve to void", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, {})
        return {} as Database
    });
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const result = await reviewDAO.deleteReviewsOfProduct("model")
    expect(result).toBeUndefined()
    mockDBGet.mockRestore()
    mockDBRun.mockRestore()
});

//Example of unit test for the reject(error) in the deleteReviewsOfProduct method

test("It should reject with error", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(new Error())
        return {} as Database
    });
    try {
        await reviewDAO.deleteReviewsOfProduct("model")
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
    }
    mockDBGet.mockRestore()
});

//Example of unit test for the error ProductNotFoundError in the deleteReviewsOfProduct method

test("It should reject with ProductNotFoundError", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, null)
        return {} as Database
    });
    try {
        await reviewDAO.deleteReviewsOfProduct("model")
    } catch (error) {
        expect(error).toBeInstanceOf(ProductNotFoundError)
    }
    mockDBGet.mockRestore()
});

//Unit test for deleteReviewsOfProduct DB Crashed

test("Delete reviews of product - DB Crashed", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        throw new Error("DB Crashed");
    });
    try{
        await reviewDAO.deleteReviewsOfProduct("model")
    }
    catch(e){
        expect(e.message).toBe("DB Crashed")
    }
    
    mockDBRun.mockRestore()
    
})

//DB Error in deleteReviewsOfProduct
test("DB Error in deleteReviewsOfProduct", async () => {
    const reviewDAO = new ReviewDAO()
    const error = new Error("DB Error");
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(error)
        return {} as Database
    });
        expect(reviewDAO.deleteReviewsOfProduct("model")).rejects.toBe(error)
   
        mockDBRun.mockRestore()
});

//Example of unit test for the deleteAllReview method

test("deleteAllReviews should delete all reviews from the database", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, ...params) => {
        const callback = params[params.length - 1];
        callback(null);
        return {} as Database;
    });

    await expect(reviewDAO.deleteAllReviews()).resolves.toBeUndefined();
    expect(mockDBRun).toHaveBeenCalledTimes(1);
    expect(mockDBRun).toHaveBeenCalledWith('DELETE FROM ProductReview',
        expect.any(Function));
});

//Example of unit test for the reject(error) in the deleteAllReviews method

test("It should reject with error", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error())
        return {} as Database
    });
    try {
        await reviewDAO.deleteAllReviews()
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
    }
    mockDBRun.mockRestore()
});

test('deleteAllReviews should reject with an error if there is an error deleting reviews', async () => {
    const errorMessage = 'Error deleting reviews';

    const reviewDAO = new ReviewDAO();
    const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, callback) => {
        callback(new Error(errorMessage));
        return {} as Database;
    });

    await expect(reviewDAO.deleteAllReviews()).rejects.toThrow(errorMessage);
    expect(mockDBRun).toHaveBeenCalledTimes(1);
});