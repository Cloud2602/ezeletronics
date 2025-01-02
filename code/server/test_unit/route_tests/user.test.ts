import { describe, test, expect, jest, beforeAll, afterEach} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import{ User, Role } from "../../src/components/user"
import UserDAO from "../../src/dao/userDAO"
import UserController from "../../src/controllers/userController"
import { UserAlreadyExistsError } from "../../src/errors/userError"
import Authenticator from "../../src/routers/auth"// Import the AuthService class
const baseURL = "/ezelectronics"
import {cleanup} from "../../src/db/cleanup"
import { beforeEach } from "node:test"


//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters

describe("POST /ezelectronics/users", () => {
test("It should return a 200 success code", async () => {
    const testUser = { //Define a test user object sent to the route
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
    const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
    //Check if the createUser method has been called with the correct parameters
    expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role)

    jest.restoreAllMocks()
    jest.clearAllMocks()
})

test("It should return a 409 error code if the user already exists", async () => { 
    const testUser = { //Define a test user object sent to the route 
        username: "test", 
        name: "test", 
        surname: "test", 
        password: "test", 
        role: "Manager" 
    } 
    jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError) //Mock the createUser method of the controller 
    const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route 
    expect(response.status).toBe(409) //Check if the response status is 409 
    expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once 
    //Check if the createUser method has been called with the correct parameters 
    expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username, 
        testUser.name, 
        testUser.surname, 
        testUser.password, 
        testUser.role) 
        jest.restoreAllMocks()
        jest.clearAllMocks()
})

test("It should return a 400 error code if the role is invalid", async () => {
    const testUser = { //Define a test user object sent to the route
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Invalid"
    }
    jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
    const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
    expect(response.status).toBe(400) //Check if the response status is 400
    expect(UserController.prototype.createUser).toHaveBeenCalledTimes(0) //Check if the createUser method has not been called
    jest.restoreAllMocks()
    jest.clearAllMocks()

})

test("It should return a 400 error code if any required field is missing", async () => {
    const testUser = { //Define a test user object sent to the route
        username: "",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
    const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
    expect(response.status).toBe(400) //Check if the response status is 400
    expect(response.body).toEqual({ error: 'Username, name, surname, password and role cannot be empty' }) // Check the error message
    expect(UserController.prototype.createUser).toHaveBeenCalledTimes(0) //Check if the createUser method has not been called
    jest.restoreAllMocks()
    jest.clearAllMocks()
})

test("It should return a 503 error code if createUser throws a generic error", async () => {
    const testUser = { //Define a test user object sent to the route
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new Error('Internal Server Error')) //Mock the createUser method of the controller
    const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
    expect(response.status).toBe(503) //Check if the response status is 503
    expect(response.body.error).toEqual( 'Internal Server Error') // Check the error message
    expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
    //Check if the createUser method has been called with the correct parameters
    expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role)
    jest.restoreAllMocks()
    jest.clearAllMocks()
})


})

describe('UserRoutes', () => {
    let login: any;
  
    beforeAll(() => {
      login = async (user: any) => {
        // Create the user first
        await request(app).post(baseURL + "/users").send({
          username: user.username,
          name: "Test",
          surname: "User",
          password: user.password,
          role: user.role
        });
        
        
        // Login the user
        const loginResponse = await request(app).post(baseURL + "/sessions").send({
          username: user.username,
          password: user.password
        });

        
  
        if (!loginResponse.headers['set-cookie']) {
          return { cookie: "", role: "" };
        } else {
          // Assuming your login response contains user data with the role
          const role = loginResponse.body.role;
          const cookie = loginResponse.headers['set-cookie'][0];
          return { cookie, role };
        }
      };
    });
  
    afterEach(() => {
      jest.clearAllMocks();
      cleanup();

    });
  
    describe('GET /users', () => {
      test('should get the list of users for the logged-in admin', async () => {
        const user = {
          username: "adminUser",
          password: "adminPass",
          role: Role.ADMIN
        };
        
        const { cookie, role } = await login(user);
  
  
        const testUser2 = {
          username: 'test2',
          name: 'test2',
          surname: 'test2',
          role: Role.MANAGER,
          birthdate: 'test2',
          address: 'test2'
        };
  
        // Mock the getUsers method of the controller
        jest.spyOn(UserController.prototype, 'getUsers').mockResolvedValueOnce([testUser2]);
  
        const response = await request(app).get(baseURL + "/users").set('Cookie', cookie);
  
        expect(response.status).toBe(200); // Check if the response status is 200
        expect(response.body).toEqual([testUser2]); // Ensure the response body is correct
        expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1); // Check if the getUsers method has been called once
      });

      test('should return 401 Forbidden for non-admin user', async () => {
        const user = {
          username: "managerUser",
          password: "managerPass",
          role: Role.MANAGER
        };
  
        const { cookie, role } = await login(user);
  
        // Check if the logged-in user is a manager
        expect(role).toBe(Role.MANAGER);
  
        const response = await request(app).get(baseURL + "/users").set('Cookie', cookie);
  
        expect(response.status).toBe(401); // Check if the response status is 403
        expect(response.body.error).toEqual("User is not an admin" ); // Ensure the response body is correct
      });

      test('should return 503 Internal Server Error when getUsers fails', async () => {
        const user = {
          username: "adminUser",
          password: "adminPass",
          role: Role.ADMIN
        };
  
        const { cookie, role } = await login(user);
  
        // Check if the logged-in user is an admin
        expect(role).toBe(Role.ADMIN);
  
        // Mock the getUsers method of the controller to throw an error
        jest.spyOn(UserController.prototype, 'getUsers').mockRejectedValueOnce(new Error('Internal Server Error'));
  
        const response = await request(app).get(baseURL + "/users").set('Cookie', cookie);
  
        expect(response.status).toBe(503); // Check if the response status is 500
        expect(response.body.error).toEqual('Internal Server Error'); // Ensure the response body is correct
        expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1); // Check if the getUsers method has been called once
      });
    });

    describe('GET /roles/:role', () => {
        test('should get the list of users for a valid role for the logged-in admin', async () => {
            const user = {
                username: "adminUser",
                password: "adminPass",
                role: Role.ADMIN
            };
            const user1 = {
                username: "user1",
                password: "user1",
                role: Role.MANAGER
            };
            const user2 = {
                username: "user2",
                password: "user2",
                role: Role.MANAGER
            };

            
            const {s, r}= await login(user1);
            const {s1, r1}= await login(user2);
            const { cookie, role } = await login(user);
            
            // Mock getUsersByRole method of the controller
            const getUsersByRoleMock = jest.spyOn(UserController.prototype, 'getUsersByRole').mockResolvedValueOnce([{ username: 'user1', name:'user1', surname:'user1', role: Role.MANAGER, address:'Via user1', birthdate: 'user1' }, { username: 'user2', name:'user2', surname:'user2', role: Role.MANAGER, address:'Via user2', birthdate: 'user2' }]);
            
            

            const response = await request(app).get(baseURL + `/users/roles/${Role.MANAGER}`).set('Cookie', cookie);
           
            expect(response.status).toBe(200);
            expect(response.body).toEqual([{ username: 'user1', name:'user1', surname:'user1', role: Role.MANAGER, address:'Via user1', birthdate: 'user1' }, { username: 'user2', name:'user2', surname:'user2', role: Role.MANAGER, address:'Via user2', birthdate: 'user2' }]);
            expect(getUsersByRoleMock).toHaveBeenCalledWith(Role.MANAGER);
        });

        test('should return 400 for an invalid role', async () => {
            const user = {
                username: "adminUser",
                password: "adminPass",
                role: Role.ADMIN
            };

            const { cookie, role } = await login(user);


            const response = await request(app).get(baseURL + `/users/roles/Invalid`).set('Cookie', cookie);

            expect(response.status).toBe(400);
            expect(response.body.error).toEqual('Invalid role. Role must be one of "Manager", "Customer", "Admin".');
        });

        test('should return 401 for a non-admin user', async () => {
            const user = {
                username: "managerUser",
                password: "managerPass",
                role: Role.MANAGER
            };

            const { cookie, role } = await login(user);

            const manager = 'Manager';

            const response = await request(app).get(baseURL + `/users/roles/${Role.MANAGER}`).set('Cookie', cookie);

            expect(response.status).toBe(401);
            expect(response.body.error).toEqual('User is not an admin' );
        });

        test('should return 500 if getUsersByRole fails', async () => {
            const user = {
                username: "adminUser",
                password: "adminPass",
                role: Role.ADMIN
            };

            const { cookie, role } = await login(user);

            

            // Mock getUsersByRole method of the controller to throw an error
            jest.spyOn(UserController.prototype, 'getUsersByRole').mockRejectedValueOnce(new Error('Internal Server Error'));

            const response = await request(app).get(baseURL + `/users/roles/${Role.MANAGER}`).set('Cookie', cookie);

            expect(response.status).toBe(503);
            expect(response.body.error).toEqual( 'Internal Server Error' );
        });
    });

    describe("GET /:username",  () =>{ 
      test("It should resolve a 200 if an admin get a username exists in the database", async () =>{ 
   
        const user = { 
          username: "adminUser", 
          password: "adminPass", 
          role: Role.ADMIN 
      }; 
      const testUser = { 
        username: 'test', 
        password: 'test', 
        role: Role.MANAGER, 
      }; 
      const {c, r} = await login(testUser); 
      const { cookie, role } = await login(user); 
      

      jest.spyOn(UserController.prototype, 'getUserByUsername').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: 'test' }); 
      const response = await request(app).get(baseURL + "/users/test").set('Cookie', cookie); 
      expect(response.status).toBe(200); 
      expect(response.body).toEqual({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: 'test' }); 
      expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1); 
      
      jest.restoreAllMocks(); 
      jest.clearAllMocks(); 
      }); 

      test("It should resolve a 200 if a user retrieve their own data", async () =>{ 
   
      const testUser = { 
        username: 'test', 
        password: 'test', 
        role: Role.MANAGER, 
      }; 
      const {c, r} = await login(testUser); 
      const { cookie, role } = await login(testUser); 
       
      jest.spyOn(UserController.prototype, 'getUserByUsername').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: 'test' }); 
      const response = await request(app).get(baseURL + "/users/test").set('Cookie', cookie); 
      expect(response.status).toBe(200); 
      expect(response.body).toEqual({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: 'test' }); 
      expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1); 
      
      jest.restoreAllMocks(); 
      jest.clearAllMocks(); 
      }); 

      test("It should resolve a 404 if a username does not exist in the database", async () => { 
          const user = { 
            username: "adminUser", 
            password: "adminPass", 
            role: Role.ADMIN 
        }; 
        const testUser = { 
          username: 'test', 
          password: 'test', 
          role: Role.MANAGER, 
        }; 
         
        const { cookie, role } = await login(user); 
   
        jest.spyOn(UserController.prototype, 'getUserByUsername').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: 'test' }); 
        try { 
          await request(app).get(baseURL + "/users/test").set('Cookie', cookie); 
        } catch (error) { 
          expect(error.status).toBe(404); 
          expect(error.response.body.error).toEqual("User not found"); 
        } 
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1); 
        jest.restoreAllMocks(); 
        jest.clearAllMocks(); 
        }); 
        test("It should resolve a 401 if a user is not an admin", async () => { 
            const user = { 
              username: "managerUser", 
              password: "managerPass", 
              role: Role.MANAGER 
          }; 
          const testUser = { 
            username: 'test', 
            password: 'test', 
            role: Role.MANAGER, 
          }; 
          const { cookie, role } = await login(user); 
          jest.spyOn(UserController.prototype, 'getUserByUsername').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: 'test' }); 
          try { 
            await request(app).get(baseURL + "/users/test").set('Cookie', cookie); 
          } catch (error) { 
            expect(error.status).toBe(401); 
            expect(error.response.body.error).toEqual("User is not an admin"); 
          } 
          jest.restoreAllMocks(); 
          jest.clearAllMocks(); 
        }); 
        test("It should resolve a 503 if the database is down", async () => { 
            const user = { 
              username: "adminUser", 
              password: "adminPass", 
              role: Role.ADMIN 
          }; 
          const testUser = { 
            username: 'test', 
            password: 'test', 
            role: Role.MANAGER, 
          }; 
          const { cookie, role } = await login(user); 
          jest.spyOn(UserController.prototype, 'getUserByUsername').mockRejectedValueOnce(new Error("Database is down")); 
          const response = await request(app).get(baseURL + "/users/test").set('Cookie', cookie); 
          expect(response.status).toBe(503); 
          expect(response.body.error).toEqual("Internal Server Error"); 
          jest.restoreAllMocks(); 
          jest.clearAllMocks(); 
        }); 
      });

    describe("DELETE /:username",  () =>{
      test("It should resolve a 200 if an admin deletes a user", async () =>{
        const user = {
          username: "adminUser",
          password: "adminPass",
          role: Role.ADMIN
      };
      const testUser = {
        username: 'test',
        password: 'test',
        role: Role.MANAGER,
      };
      const { cookie, role } = await login(user);
      const {c, r} = await login(testUser);

      jest.spyOn(UserController.prototype, 'deleteUser').mockResolvedValueOnce(true);
      const response = await request(app).delete(baseURL + "/users/test").set('Cookie', cookie);
      expect(response.status).toBe(200);
      expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1);
      jest.restoreAllMocks();
      jest.clearAllMocks();

      });

      test("It should resolve a 200 if a user deletes their own account", async () =>{
        const testUser = {
          username: 'test',
          password: 'test',
          role: Role.MANAGER,
        };
        const { cookie, role } = await login(testUser);
        

        jest.spyOn(UserController.prototype, 'deleteUser').mockResolvedValueOnce(true);
        const response = await request(app).delete(baseURL + "/users/test").set('Cookie', cookie);
        expect(response.status).toBe(200);
        expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1);
        jest.restoreAllMocks();
        jest.clearAllMocks();

        });

        test("It should resolve a 404 if a username does not exist in the database", async () => {
            const user = {
              username: "adminUser",
              password: "adminPass",
              role: Role.ADMIN
          };
          
          const { cookie, role } = await login(user);
          jest.spyOn(UserController.prototype, 'deleteUser').mockResolvedValueOnce(true);
          try {
            await request(app).delete(baseURL + "/users/test").set('Cookie', cookie);
          } catch (error) {
            expect(error.status).toBe(404);
            expect(error.response.body.error).toEqual("User not found");
          }
          expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1);
          jest.restoreAllMocks();
          jest.clearAllMocks();
          });
        

        test("It should resolve a 401 if a user is not an admin", async () => {
            const user = {
              username: "managerUser",
              password: "managerPass",
              role: Role.MANAGER
          };
          const testUser = {
            username: 'test',
            password: 'test',
            role: Role.MANAGER,
          };
          const { cookie, role } = await login(user);
          jest.spyOn(UserController.prototype, 'deleteUser').mockResolvedValueOnce(true);
          try {
            await request(app).delete(baseURL + "/users/test").set('Cookie', cookie);
          } catch (error) {
            expect(error.status).toBe(401);
            expect(error.response.body.error).toEqual("User is not an admin");
          }
          jest.restoreAllMocks();
          jest.clearAllMocks();
        });

        test("It should resolve a 503 if the database is down", async () => {
            const user = {
              username: "adminUser",
              password: "adminPass",
              role: Role.ADMIN
          };
          const testUser = {
            username: 'test',
            password: 'test',
            role: Role.MANAGER,
          };
          const { cookie, role } = await login(user);
          jest.spyOn(UserController.prototype, 'deleteUser').mockRejectedValueOnce(new Error("Database is down"));
          const response = await request(app).delete(baseURL + "/users/test").set('Cookie', cookie);
          expect(response.status).toBe(503);
          expect(response.body.error).toEqual("Internal Server Error");
          jest.restoreAllMocks();
          jest.clearAllMocks();
        });

      });

      describe("DELETE /users ",  () =>{
        test("It should resolve a 200 if a user is logged in", async () =>{ 
 
          const user = { 
            username: "adminUser", 
            password: "adminPass", 
            role: Role.ADMIN 
        }; 
        const testUser = { 
          username: 'test', 
          password: 'test', 
          role: Role.MANAGER, 
        }; 
        const { cookie, role } = await login(user); 
        const {c, r} = await login(testUser);
        expect(role).toBe(Role.ADMIN); 
        jest.spyOn(UserController.prototype, 'deleteUser').mockResolvedValueOnce(true); 
        const response = await request(app).delete(baseURL + "/users").set('Cookie', cookie); 
        expect(response.status).toBe(200); 
         
        jest.restoreAllMocks(); 
        jest.clearAllMocks(); 
        });
  
        test("It should resolve a 401 if a user is not an admin", async () =>{
          const user = {
            username: "managerUser",
            password: "managerPass",
            role: Role.MANAGER
        };
        const testUser = {
          username: 'test',
          password: 'test',
          role: Role.MANAGER,
        };
        const { cookie, role } = await login(user);
        jest.spyOn(UserController.prototype, 'deleteAll').mockResolvedValueOnce(true);
        try {
          await request(app).delete(baseURL + "/users").set('Cookie', cookie);
        } catch (error) {
          expect(error.status).toBe(401);
          expect(error.response.body.error).toEqual("User is not an admin");
        }
        jest.restoreAllMocks();
        jest.clearAllMocks();
        });
  
        test("It should resolve a 503 if the database is down", async () =>{
          const user = {
            username: "adminUser",
            password: "adminPass",
            role: Role.ADMIN
        };
        const testUser = {
          username: 'test',
          password: 'test',
          role: Role.MANAGER,
        };
        const { cookie, role } = await login(user);
        jest.spyOn(UserController.prototype, 'deleteAll').mockRejectedValueOnce(new Error("Database is down"));
        const response = await request(app).delete(baseURL + "/users").set('Cookie', cookie);
        expect(response.status).toBe(503);
        expect(response.body.error).toEqual("Internal Server Error");
      });
    });

    
  describe("PATCH /:username",  () =>{ 

    test("It should resolve a 200 if a username exists in the database and return the modified user , called by an admin", async () =>{ 
 
      const user = { 
        username: "adminUser", 
        password: "adminPass", 
        role: Role.ADMIN 
    }; 
    const testUser = { 
      username: 'test', 
      password: 'test', 
      role: Role.MANAGER, 
    }; 
    expect(user.role).toBe(Role.ADMIN); 
    expect(testUser.role).toBe(Role.MANAGER ); 
     
    const { cookie, role } = await login(user); 
    const {c, r} = await login(testUser); 
    jest.spyOn(UserController.prototype, 'updateUserInfo').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: '2012-04-04' }); 
    const response = await request(app).patch(baseURL + "/users/test").set('Cookie', cookie).send({ name: 'test', surname: 'test', address: 'Via test', birthdate: '2012-04-04' }); 
    expect(response.status).toBe(200); 
    expect(response.body).toEqual({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: '2012-04-04' }); 
    expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1); 
    jest.restoreAllMocks(); 
    jest.clearAllMocks(); 
    }); 

    test("It should resolve a 200 if a username exists in the database and return himself , called by customer or manager", async () =>{ 
        const user = { 
          username: "managerUser", 
          password: "managerPass", 
          role: Role.MANAGER 
      }; 
      expect(user.role).toBe(Role.MANAGER); 
      const { cookie, role } = await login(user); 
      jest.spyOn(UserController.prototype, 'updateUserInfo').mockResolvedValueOnce({ username: 'managerUser', name:'managerUser', surname:'manager', role: Role.MANAGER, address:'Via manager', birthdate: '2012-04-04' }); 
      const response = await request(app).patch(baseURL + "/users/managerUser").set('Cookie', cookie).send({ name: 'managerUser', surname: 'manager', address: 'Via manager', birthdate: '2012-04-04' }); 
      expect(response.status).toBe(200); 
      expect(response.body).toEqual({ username: 'managerUser', name:'managerUser', surname:'manager', role: Role.MANAGER, address:'Via manager', birthdate: '2012-04-04' }); 
      expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1); 
      jest.restoreAllMocks(); 
      jest.clearAllMocks(); 
    }); 

    test("It should resolve a 401 if a user is not logged in", async () => { 
 
      const user = { 
        username: "adminUser", 
        password: "adminPass", 
        role: Role.ADMIN 
    }; 
    const testUser = { 
      username: 'test', 
      password: 'test', 
      role: Role.MANAGER, 
    }; 
    const { cookie, role } = await login(user); 
    jest.spyOn(UserController.prototype, 'updateUserInfo').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: '2012-04-04' }); 
    try { 
      await request(app).patch(baseURL + "/users/test").send({ name: 'test', surname: 'test', address: 'Via test', birthdate: '2012-04-04' }); 
    } catch (error) { 
      expect(error.status).toBe(401); 
      expect(error.response.body.error).toEqual("User is not logged in"); 
    } 
    jest.restoreAllMocks(); 
    jest.clearAllMocks(); 
    }); 

    test("It should resolve a 401 if a user is not an admin and tries to modify another user", async () => { 
      const user = { 
        username: "managerUser", 
        password: "managerPass", 
        role: Role.MANAGER 
    }; 
    const testUser = { 
      username: 'test', 
      password: 'test', 
      role: Role.MANAGER, 
    }; 
    const { cookie, role } = await login(user); 
    const {c, r} = await login(testUser); 
    jest.spyOn(UserController.prototype, 'updateUserInfo').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: '2012-04-04' }); 
    try { 
      await request(app).patch(baseURL +"/users/test").set('Cookie', cookie).send({ name: 'test', surname: 'test', address: 'Via test', birthdate: '2012-04-04' }); 
    } catch (error) { 
      expect(error.status).toBe(401); 
      expect(error.response.body.error).toEqual("User is not an admin"); 
    } 
    }); 

    test("It should resolve a 401 if a user is admin and tries to modify another admin", async () => { 
      const user = { 
        username: "adminUser", 
        password: "adminPass", 
        role: Role.ADMIN 
    }; 
    const testUser = { 
      username: 'test', 
      password: 'test', 
      role: Role.ADMIN, 
    }; 
    const { cookie, role } = await login(user); 
    const {c, r} = await login(testUser); 
    jest.spyOn(UserController.prototype, 'updateUserInfo').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: '2012-04-04' }); 
    try { 
      await request(app).patch(baseURL + "/users/test").set('Cookie', cookie).send({ name: 'test', surname: 'test', address: 'Via test', birthdate: '2012-04-04' }); 
    } catch (error) { 
      expect(error.status).toBe(401); 
      expect(error.response.body.error).toEqual("User is not an admin"); 
    } 
    }); 
 
 
    test("It should resolve a 400 error if any of the fields is empty", async () => { 
        const user = { 
          username: "adminUser", 
          password: "adminPass", 
          role: Role.ADMIN 
      }; 
      const testUser = { 
        username: 'test', 
        password: 'test', 
        role: Role.MANAGER, 
      }; 
      const { cookie, role } = await login(user); 
      const {c, r} = await login(testUser); 
      jest.spyOn(UserController.prototype, 'updateUserInfo').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: '2012-04-04' }); 
      try { 
        await request(app).patch(baseURL + "/users/test").set('Cookie', cookie).send({ name: '', surname: 'test', address: 'Via test', birthdate: '2012-04-04' }); 
      } catch (error) { 
        expect(error.status).toBe(400); 
        expect(error.response.body.error).toEqual("Name cannot be empty"); 
      } 
      jest.restoreAllMocks(); 
      jest.clearAllMocks(); 
      }); 
      test("It should resolve a 400 error if the birthdate is after the current date", async () => { 
          const user = { 
            username: "adminUser", 
            password: "adminPass", 
            role: Role.ADMIN 
        }; 
        const testUser = { 
          username: 'test', 
          password: 'test', 
          role: Role.MANAGER, 
        }; 
        const { cookie, role } = await login(user); 
        const {c, r} = await login(testUser); 
        jest.spyOn(UserController.prototype, 'updateUserInfo').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: '2012-04-04' }); 
        try { 
          await request(app).patch(baseURL + "/users/test").set('Cookie', cookie).send({ name: 'test', surname: 'test', address: 'Via test', birthdate: '2025-04-04' }); 
        } catch (error) { 
          expect(error.status).toBe(400); 
          expect(error.response.body.error).toEqual("Birthdate cannot be after the current date"); 
        } 
        jest.restoreAllMocks(); 
        jest.clearAllMocks(); 
 
           
        }); 
      test("It should resolve a 404 if a username does not exist in the database", async () => { 
        const user = { 
          username: "adminUser", 
          password: "adminPass", 
          role: Role.ADMIN 
      }; 
      const testUser = { 
        username: 'test', 
        password: 'test', 
        role: Role.MANAGER, 
      }; 
      const { cookie, role } = await login(user); 
      jest.spyOn(UserController.prototype, 'updateUserInfo').mockResolvedValueOnce({ username: 'test', name:'test', surname:'test', role: Role.MANAGER, address:'Via test', birthdate: '2012-04-04' }); 
      try { 
        await request(app).patch(baseURL + "/users/test").set('Cookie', cookie).send({ name: 'test', surname: 'test', address: 'Via test', birthdate: '2012-04-04' }); 
      } catch (error) { 
        expect(error.status).toBe(404); 
        expect(error.response.body.error).toEqual("User not found"); 
      } 
      jest.restoreAllMocks(); 
      jest.clearAllMocks(); 
      }); 
      test("It should resolve a 503 if the database is down", async () => { 
          const user = { 
            username: "adminUser", 
            password: "adminPass", 
            role: Role.ADMIN 
        }; 
        const testUser = { 
          username: 'test', 
          password: 'test', 
          role: Role.MANAGER, 
        }; 
        const { cookie, role } = await login(user); 
        jest.spyOn(UserController.prototype, 'updateUserInfo').mockRejectedValueOnce(new Error("Database is down")); 
        const response = await request(app).patch(baseURL + "/users/test").set('Cookie', cookie).send({ name: 'test', surname: 'test', address: 'Via test', birthdate: '2012-04-04' }); 
        expect(response.status).toBe(503); 
        expect(response.body.error).toEqual("Internal Server Error"); 
        jest.restoreAllMocks(); 
        jest.clearAllMocks(); 
      }); 
 
       
    }); 
 
  });




    
  
    