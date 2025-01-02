import { test, expect, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { afterEach, before, beforeEach, describe } from "node:test"
import { UserAlreadyExistsError, UserNotFoundError, UnauthorizedUserError, UserIsAdminError } from "../../src/errors/userError"
import { User, Role } from "../../src/components/user"
jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

describe("UserController", () =>{
 
    afterEach(()=>{
        jest.clearAllMocks()
    })

/****************************CREATE USER ***************************************************/
describe("Create User", () => {
test("It should return true", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: Role.MANAGER
    }
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the createUser method of the controller with the test user object
    const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role);
    expect(response).toBe(true); //Check if the response is true
});
})

test("It should reject with UserAlreadyExistError", async () => {
    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: Role.MANAGER
    };

    
    jest.spyOn(UserDAO.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError); // Mock the createUser method of the DAO to reject with UserAlreadyExistError

    const controller = new UserController(); // Create a new instance of the controller

    // Call the createUser method of the controller with the test user object and expect it to reject with UserAlreadyExistError
    await expect(controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role))
        .rejects.toThrow(UserAlreadyExistsError);

    
    
});

test("It should reject with an error when user creation fails", async () => {
    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: Role.MANAGER
    };

    const controller = new UserController();
   
    jest.spyOn(UserDAO.prototype, "createUser").mockRejectedValueOnce(new Error);

    await expect(controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role))
        .rejects.toThrow(Error);

});

/*******************************GET USERS ************************************************************/
describe("Get Users", () => {
    test("It should return an array of users", async () => {
        const testUser1 : User =  {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "test",
            birthdate: "test",
        }
        const testUser2 : User =  {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "test",
            birthdate: "test",
        }
        jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce([testUser1, testUser2]);

        const controller = new UserController();
        const response = await controller.getUsers();

        expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
        expect(response).toEqual([testUser1, testUser2]);
        jest.clearAllMocks();
       
    });

    test("It should return an empty array if there are no users", async () => { 
        jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce([]); //Mock the getUsers method of the DAO to return an empty array 
        const controller = new UserController(); //Create a new instance of the controller 
        //Call the getUsers method of the controller 
        const response = await controller.getUsers(); 
     
        //Check if the getUsers method of the DAO has been called once 
        expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1); 
        expect(response).toEqual([]); //Check if the response is an empty array 
    });

    test("It should reject with an error when getting users fails", async () => {
        jest.spyOn(UserDAO.prototype, "getUsers").mockRejectedValueOnce(new Error());
        const controller= new UserController();
        await expect(controller.getUsers()).rejects.toThrow(Error);
    });
})

/**********************************GET USER BY ROLE*********************************************************/
describe("Get users by role", () => { 
    test("It should return an array of users", async () => { 
        //Define an array of test user objects 
        const testUser: User = { //Define a test user object with the correct type 
            username: "test", 
            name: "test", 
            surname: "test", 
            role: Role.MANAGER, //Assign the role property with the correct type 
            address: "test", 
            birthdate: "test", 
        } 
        const testUser2: User = { //Define a test user object with the correct type 
            username: "test2", 
            name: "test2", 
            surname: "test2", 
            role: Role.MANAGER, //Assign the role property with the correct type 
            address: "test2", 
            birthdate: "test2", 
        } 
        jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce([testUser, testUser2]); //Mock the getUsersByRole method of the DAO 
        const controller = new UserController(); //Create a new instance of the controller 
        //Call the getUsersByRole method of the controller 
        const response = await controller.getUsersByRole(Role.MANAGER); 
     
        //Check if the getUsersByRole method of the DAO has been called once with the correct parameter 
        expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1); 
        expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(Role.MANAGER); 
        expect(response).toEqual([testUser, testUser2]); //Check if the response is an array containing the test user object 
        jest.clearAllMocks();
        jest.resetAllMocks();
    }); 
    test("It should return an empty array if there are no users with the specified role", async () => { 
        jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce([]); //Mock the getUsersByRole method of the DAO to return an empty array 
        const controller = new UserController(); //Create a new instance of the controller 
        //Call the getUsersByRole method of the controller 
        const response = await controller.getUsersByRole(Role.MANAGER); 
     
        //Check if the getUsersByRole method of the DAO has been called once with the correct parameter 
        expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1); 
        expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(Role.MANAGER); 
        expect(response).toEqual([]); //Check if the response is an empty array 
        jest.clearAllMocks();
    }); 
    test("It should throw an error if the retrieval fails", async () => { 
        jest.spyOn(UserDAO.prototype, "getUsersByRole").mockRejectedValueOnce(new Error()); //Mock the getUsersByRole method of the DAO to throw an error 
        const controller = new UserController(); //Create a new instance of the controller 
        //Call the getUsersByRole method of the controller 
        await expect(controller.getUsersByRole(Role.MANAGER)).rejects.toThrow(Error); //Check if the method throws an error  
        jest.clearAllMocks();   
    }); 
}); 

/**************************************GET USER BY SURNAME *********************************************/
    describe("Get user by username", () => { 
        test("It should return a user", async () => { 
            const testUser: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the getUserByUsername method of the controller 
            const response = await controller.getUserByUsername(testUser, testUser.username); 
    
            //Check if the getUserByUsername method of the DAO has been called once with the correct parameter 
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1); 
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(testUser.username); 
            expect(response).toEqual(testUser); //Check if the response is the test user object 
            jest.clearAllMocks();
        }); 
        test("It should return an unauthorized error if the user is not an admin or the same as the requested user", async () => {
            const testUser1: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.CUSTOMER, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            const testUser2: User = { //Define a test user object with the correct type 
                username: "test2", 
                name: "test2", 
                surname: "test2", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test2", 
                birthdate: "test2", 
            }
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser2); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the getUserByUsername method of the controller with a different username than the test user 
            await expect(controller.getUserByUsername(testUser1, testUser2.username)).rejects.toThrow(UnauthorizedUserError); //Check if the method throws an UnauthorizedUserError 
            jest.clearAllMocks();
        })

        test("It should return a user if the user is an admin", async () => {
            const testUser1: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.ADMIN, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            const testUser2: User = { //Define a test user object with the correct type 
                username: "test2", 
                name: "test2", 
                surname: "test2", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test2", 
                birthdate: "test2", 
            }
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser2); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the getUserByUsername method of the controller with a different username than the test user 
            const response = await controller.getUserByUsername(testUser1, testUser2.username); //Check if the method throws an UnauthorizedUserError 
            expect(response).toEqual(testUser2); //Check if the response is the test user object 
            jest.clearAllMocks();
            jest.resetAllMocks();
        })

        test("It should throw an error if the user is not found", async () => { 
            const testUser: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError()); //Mock the getUserByUsername method of the DAO to throw a UserNotFoundError 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the getUserByUsername method of the controller 
            await expect(controller.getUserByUsername(testUser, testUser.username)).rejects.toThrow(UserNotFoundError); //Check if the method throws a UserNotFoundError 
            jest.clearAllMocks();
        }); 
        test("It should throw an error if the retrieval fails", async () => { 
            const testUser: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new Error()); //Mock the getUserByUsername method of the DAO to throw an error 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the getUserByUsername method of the controller 
            await expect(controller.getUserByUsername(testUser, testUser.username)).rejects.toThrow(Error); //Check if the method throws an error 
            jest.clearAllMocks();
        }); 
    }); 

///////*****************DELETE*************************************************** */
    describe("Delete user", () => {  

        test("It should delete themselves ", async () => { 
            const testUser: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true); //Mock the deleteUser method of the DAO 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the deleteUser method of the controller 
            const response = await controller.deleteUser(testUser, testUser.username); 
         
            //Check if the deleteUser method of the DAO has been called once with the correct parameter 
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1); 
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(testUser.username); 
            expect(response).toBe(true); //Check if the response is true
            jest.clearAllMocks(); 
            jest.resetAllMocks();
        });
        
        
        test("It should delete another user if the user is an admin", async () => { 
            const testUser1: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.ADMIN, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            const testUser2: User = { //Define a test user object with the correct type 
                username: "test2", 
                name: "test2", 
                surname: "test2", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test2", 
                birthdate: "test2", 
            } 
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true); //Mock the deleteUser method of the DAO 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser2); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the deleteUser method of the controller 
            const response = await controller.deleteUser(testUser1, testUser2.username); 
         
            //Check if the deleteUser method of the DAO has been called once with the correct parameter 
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1); 
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(testUser2.username); 
            expect(response).toBe(true); //Check if the response is true 
            jest.clearAllMocks();
            jest.resetAllMocks();
        });

        
        test("It should throw an unauthorized error if the user is not an admin and try to delete an other user", async () => {
            const testUser1: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.CUSTOMER, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            const testUser2: User = { //Define a test user object with the correct type 
                username: "test2", 
                name: "test2", 
                surname: "test2", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test2", 
                birthdate: "test2", 
            }
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true); //Mock the deleteUser method of the DAO 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser2); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the deleteUser method of the controller with a different username than the test user 
            await expect(controller.deleteUser(testUser1, testUser2.username)).rejects.toThrow(new UnauthorizedUserError); //Check if the method throws an UnauthorizedUserError 
            jest.clearAllMocks();
            jest.resetAllMocks();
        })
        test("It should throw an UserIsAdminError if the user is an admin and try to delete an other admin", async () => {
            const testUser1: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.ADMIN, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            const testUser2: User = { //Define a test user object with the correct type 
                username: "test2", 
                name: "test2", 
                surname: "test2", 
                role: Role.ADMIN, //Assign the role property with the correct type 
                address: "test2", 
                birthdate: "test2", 
            }
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true); //Mock the deleteUser method of the DAO 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser2); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the deleteUser method of the controller with a different username than the test user 
            await expect(controller.deleteUser(testUser1, testUser2.username)).rejects.toThrow(new UserIsAdminError); //Check if the method throws an UnauthorizedUserError
            jest.clearAllMocks();
            jest.resetAllMocks();
        })
        test("It should throw an error if the deletion fails", async () => { 
            const testUser: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            jest.spyOn(UserDAO.prototype, "deleteUser").mockRejectedValueOnce(new Error()); //Mock the deleteUser method of the DAO to throw an error 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the deleteUser method of the controller 
            await expect(controller.deleteUser(testUser, testUser.username)).rejects.toThrow(Error); //Check if the method throws an error 
            jest.clearAllMocks();
            jest.resetAllMocks();
        }); 
    }); 

    describe("Delete all non-admin users", () => { 
        test("It should return true", async () => { 
            jest.spyOn(UserDAO.prototype, "deleteNonAdminUsers").mockResolvedValueOnce(true); //Mock the deleteAll method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the deleteAll method of the controller 
            const response = await controller.deleteAll(); 
         
            //Check if the deleteAll method of the DAO has been called once 
            expect(UserDAO.prototype.deleteNonAdminUsers).toHaveBeenCalledTimes(1); 
            expect(response).toBe(true); //Check if the response is true 
            jest.clearAllMocks() 
            jest.resetAllMocks() 
        }); 
        test("It should throw an error if the deletion fails", async () => { 
            jest.spyOn(UserDAO.prototype, "deleteNonAdminUsers").mockRejectedValueOnce(new Error()); //Mock the deleteAll method of the DAO to throw an error 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the deleteAll method of the controller 
            await expect(controller.deleteAll()).rejects.toThrow(Error); //Check if the method throws an error 
            jest.clearAllMocks() 
            jest.resetAllMocks() 
        }); 
    });
 
    describe("Update user Info", () => { 
        test("It should return the updated user", async () => { 
            const testUser: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(testUser); //Mock the updateUserInfo method of the DAO 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the updateUserInfo method of the controller 
            const response = await controller.updateUserInfo(testUser, testUser.name, testUser.surname, testUser.address, testUser.birthdate, testUser.username); 
         
            //Check if the updateUserInfo method of the DAO has been called once with the correct parameters 
            expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1); 
            expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(testUser.username, 
                testUser.name, 
                testUser.surname, 
                testUser.address, 
                testUser.birthdate); 
            expect(response).toEqual(testUser); //Check if the response is the test user object 
            jest.clearAllMocks() 
            jest.resetAllMocks() 
        }); 
        test("It should update an other user if the user is an andmin", async () => {
            const testUser1: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.ADMIN, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            const testUser2: User = { //Define a test user object with the correct type 
                username: "test2", 
                name: "test2", 
                surname: "test2", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test2", 
                birthdate: "test2", 
            } 
            jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(testUser2); //Mock the updateUserInfo method of the DAO 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser2); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the updateUserInfo method of the controller 
            const response = await controller.updateUserInfo(testUser1, testUser2.name, testUser2.surname, testUser2.address, testUser2.birthdate, testUser2.username); 
            //Check if the updateUserInfo method of the DAO has been called once with the correct parameters 
            expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1); 
            expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(testUser2.username, 
                testUser2.name, 
                testUser2.surname, 
                testUser2.address, 
                testUser2.birthdate); 
            expect(response).toEqual(testUser2); //Check if the response is the test user object 
            jest.clearAllMocks() 
            jest.resetAllMocks()
        });
        test("It should throw an unauthorized error if the user is a Customer and is not the same as the requested user", async () => { 
            const testUser1: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.CUSTOMER, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            const testUser2: User = { //Define a test user object with the correct type 
                username: "test2", 
                name: "test2", 
                surname: "test2", 
                role: Role.CUSTOMER, //Assign the role property with the correct type 
                address: "test2", 
                birthdate: "test2", 
            } 
            jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(testUser2); //Mock the updateUserInfo method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the updateUserInfo method of the controller with a different username than the test user 
            await expect(controller.updateUserInfo(testUser1, testUser2.name, testUser2.surname, testUser2.address, testUser2.birthdate, testUser2.username)).rejects.toThrow(new UnauthorizedUserError()); //Check if the method throws an UnauthorizedUserError 
            jest.clearAllMocks() 
            jest.resetAllMocks() 
        });
        
        test("It should throw an error if the update fails", async () => { 
            const testUser: User = { //Define a test user object with the correct type 
                username: "test", 
                name: "test", 
                surname: "test", 
                role: Role.MANAGER, //Assign the role property with the correct type 
                address: "test", 
                birthdate: "test", 
            } 
            jest.spyOn(UserDAO.prototype, "updateUserInfo").mockRejectedValueOnce(new Error()); //Mock the updateUserInfo method of the DAO to throw an error 
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser); //Mock the getUserByUsername method of the DAO 
            const controller = new UserController(); //Create a new instance of the controller 
            //Call the updateUserInfo method of the controller 
            await expect(controller.updateUserInfo(testUser, testUser.name, testUser.surname, testUser.address, testUser.birthdate, testUser.username)).rejects.toThrow(Error); //Check if the method throws an error 
            jest.clearAllMocks() 
            jest.resetAllMocks() 
        }); 
    }); 
 
})




