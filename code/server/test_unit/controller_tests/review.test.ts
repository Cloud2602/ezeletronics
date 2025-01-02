import { test, expect, jest } from "@jest/globals";
import ReviewController from "../../src/controllers/reviewController";
import ReviewDAO from "../../src/dao/reviewDAO";
import {User, Role} from "../../src/components/user";

jest.mock("../../src/dao/reviewDAO");

//Example of a unit test for the createReview method of the ReviewController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

test("It should return true", async () => {
        //Define a test review object
        const testModel= "test";
        const testUser= new User("test", "test", "test", Role.CUSTOMER, "test", "test");
        const testScore= 1;
        const testComment= "Great product!";
    
    jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValueOnce(); //Mock the createReview method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    //Call the createReview method of the controller with the test review object
    const response = await controller.addReview(testModel, testUser , testScore, testComment);

    //Check if the createReview method of the DAO has been called once with the correct parameters
    expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(
        testModel,
        testUser,
        testScore,
        testComment);
});


//Example of a unit test for the getProductReviews method of the ReviewController
//The test checks if the method returns an array of reviews when the DAO method returns an array of reviews
//The test also expects the DAO method to be called once with the correct parameters

test("It should return an array of reviews", async () => {
    //Define a test model
    const testModel = "test";
    const testReview = [{
        model: testModel,
        user: "test",
        score: 1,
        date: "2022-01-01",
        comment: "Great product!"
    }];
    

    jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce(testReview); //Mock the getProductReviews method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    //Call the getProductReviews method of the controller with the test model
    const response = await controller.getProductReviews(testModel);

    //Check if the getProductReviews method of the DAO has been called once with the correct parameters
    expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(testModel);
    expect(response).toEqual(testReview); //Check if the response is an array of reviews
});


//Example of unit test for the deleteReview method of the ReviewController
//The test checks if the method returns nothing when the DAO method returns nothing beacuse it's a void method
//The test also expects the DAO method to be called once with the correct parameters

test("It should return nothing", async () => {
    //Define a test model
    const testModel = "test";
    const testUser = new User("test", "test", "test", Role.CUSTOMER, "test", "test");
    

    jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce(); //Mock the deleteReview method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    //Call the deleteReview method of the controller with the test model
    const response = await controller.deleteReview(testModel, testUser);

    //Check if the deleteReview method of the DAO has been called once with the correct parameters
    expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(testModel, testUser);
    expect(response).toBeUndefined(); //Check if the response is undefined
});

//Example of unit test for the deleteReviewsOfProduct method of the ReviewController
//The test checks if the method returns nothing when the DAO method returns nothing beacuse it's a void method

test("It should return nothing", async () => {
    //Define a test model
    const testModel = "test";
    

    jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(); //Mock the deleteReviewsOfProduct method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    //Call the deleteReviewsOfProduct method of the controller with the test model
    const response = await controller.deleteReviewsOfProduct(testModel);

    //Check if the deleteReviewsOfProduct method of the DAO has been called once with the correct parameters
    expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(testModel);
    expect(response).toBeUndefined(); //Check if the response is undefined
});

//Example of unit test for the deleteAllReviews method of the ReviewController

test("It should return nothing", async () => {
    jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce(); //Mock the deleteAllReviews method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    //Call the deleteAllReviews method of the controller
    const response = await controller.deleteAllReviews();

    //Check if the deleteAllReviews method of the DAO has been called once
    expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
    expect(response).toBeUndefined(); //Check if the response is undefined
});



