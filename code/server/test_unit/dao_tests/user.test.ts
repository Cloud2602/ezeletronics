import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError";
import { User, Role } from "../../src/components/user";

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

describe("Get is User Authenticated", () => {

    test("getIsUserAuthenticated - success", async () => {
        const userDAO = new UserDAO();
        const user = {username: "username", password: Buffer.from("hashedPassword").toString('hex'), salt: Buffer.from("salt").toString('hex')}
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, user)
            return {} as Database
        });

        
        // Mocking crypto.scryptSync to return a fixed hashed password
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
            return Buffer.from("hashedPassword");
        });

        const mock = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((password, hexpsw) => {
            return true;
        });

    try {
        const result = await userDAO.getIsUserAuthenticated("username", "password");
        expect(result).toBe(true);
    } finally {
        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
    }

    });

    test("getIsUserAuthenticated - error no username", async () => {
        const userDAO = new UserDAO();
        const user = {username: "nousername", password: Buffer.from("hashedPassword").toString('hex'), salt: Buffer.from("salt").toString('hex')}
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, user)
            return {} as Database
        });

        
        // Mocking crypto.scryptSync to return a fixed hashed password
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
            return Buffer.from("hashedPassword");
        });

        const mock = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((password, hexpsw) => {
            return true;
        });

    try {
        const result = await userDAO.getIsUserAuthenticated("username", "password");
        expect(result).toBe(false);
    } finally {
        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
    }

    });

    test("getIsUserAuthenticated - error wrong password", async () => {
        const userDAO = new UserDAO();
        const user = {username: "username", password: Buffer.from("hashedPassword").toString('hex'), salt: Buffer.from("salt").toString('hex')}
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, user)
            return {} as Database
        });

        
        // Mocking crypto.scryptSync to return a fixed hashed password
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
            return Buffer.from("hashedPassword");
        });

        const mock = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((password, hexpsw) => {
            return false;
        });

    try {
        const result = await userDAO.getIsUserAuthenticated("username", "nopassword");
        expect(result).toBe(false);
    } finally {
        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
    }
    });
    test("Get is user Authenticated - DB Crashed", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB Crashed");
        });
        try{
            await userDAO.getIsUserAuthenticated("username", "password")
        }
        catch(e){
            expect(e.message).toBe("DB Crashed")
        }
        finally{
        mockDBGet.mockRestore()
        }
    })

    test("DB Error in Get is user Authenticated callback", async () => {
        const userDAO = new UserDAO();
        const error = new Error("DB Error");

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(error, null);
            return {} as Database;
        });

        await expect(userDAO.getIsUserAuthenticated("username", "password")).rejects.toBe(error);
})
})

/*********************************CREATE USER******************************/
describe("Create User", () => {
test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return (Buffer.from("salt"))
    })
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword")
    })
    const result = await userDAO.createUser("username", "name", "surname", "password", "role")
    expect(result).toBe(true)
    mockRandomBytes.mockRestore()
    mockDBRun.mockRestore()
    mockScrypt.mockRestore()
})

test("It shold reject an UserAlreadyExistError", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback({message: "SQLITE_CONSTRAINT: UNIQUE constraint failed: users.username"})
        return {} as Database
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return (Buffer.from("salt"))
    })
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword")
    })
    const result=await expect(userDAO.createUser("username", "name", "surname", "password", "role"))
                .rejects.toThrow(UserAlreadyExistsError)
    mockRandomBytes.mockRestore()
    mockDBRun.mockRestore()
    mockScrypt.mockRestore()
    
})

test("Create user - DB Crashed", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        throw new Error("DB Crashed");
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return (Buffer.from("salt"))
    })
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword")
    })
    try{
         await userDAO.createUser("username", "name", "surname", "password", "role")
    }
    catch(e){
        expect(e.message).toBe("DB Crashed")
    }
    finally{
    mockRandomBytes.mockRestore()
    mockDBRun.mockRestore()
    mockScrypt.mockRestore()
    }
})

test("DB Error in createUser callback", async () => {
    const userDAO = new UserDAO();
    const error = new Error("DB Error");

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(error);
        return {} as Database;
    });

    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return (Buffer.from("salt"))
    })
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword")
    })

    await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toBe(error);

    mockRandomBytes.mockRestore()
    mockDBRun.mockRestore()
    mockScrypt.mockRestore()
})

})

/*********************************GET USER BY USERNAME******************************/

describe("GetUserByUsername ", () => {
    test("It should resolve an user", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {username: "username", name: "name", surname: "surname", role: Role.CUSTOMER})
            return {} as Database
        });
        const result = await userDAO.getUserByUsername("username")
        expect(result).toEqual({username: "username", name: "name", surname: "surname", role: Role.CUSTOMER})
        mockDBGet.mockRestore()
    })
    test("It should reject an UserNotFoundError", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, undefined)
            return {} as Database
        });
        const result=await expect(userDAO.getUserByUsername("username"))
                    .rejects.toThrow(UserNotFoundError)
        mockDBGet.mockRestore()
    })

    test("Get user by username - DB Crashed", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB Crashed");
        });
        try{
            await userDAO.getUserByUsername("username")
        }
        catch(e){
            expect(e.message).toBe("DB Crashed")
        }
        finally{
        mockDBGet.mockRestore()
        }
    })

    test("DB Error in getUserByUsername callback", async () => {
        const userDAO = new UserDAO();
        const error = new Error("DB Error");

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(error, null);
            return {} as Database;
        });

        await expect(userDAO.getUserByUsername("username")).rejects.toBe(error);

        mockDBGet.mockRestore();
    })
    
})

/*********************************GET LIST OF USERS******************************/

describe("GetUsers", () => {
    test("It should resolve a list of users", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [{username: "username", name: "name", surname: "surname", role: Role.CUSTOMER},
                            {username: "username", name: "name", surname: "surname", role: Role.MANAGER}])
            return {} as Database
        });
        const result = await userDAO.getUsers()
        expect(result).toEqual([{username: "username", name: "name", surname: "surname", role: Role.CUSTOMER},
                                {username: "username", name: "name", surname: "surname", role: Role.MANAGER}])
        mockDBAll.mockRestore()
    })

    test("It should resolve an empty list", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });
        const result = await userDAO.getUsers()
        expect(result).toEqual([])
        mockDBAll.mockRestore()
    })

    test("Get users - DB Crashed", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error("DB Crashed");
        });
        try{
            await userDAO.getUsers()
        }
        catch(e){
            expect(e.message).toBe("DB Crashed")
        }
        finally{
        mockDBAll.mockRestore()
        }
    })

    test("DB Error in getUsers callback", async () => {
        const userDAO = new UserDAO();
        const error = new Error("DB Error");

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(error, null);
            return {} as Database;
        });

        await expect(userDAO.getUsers()).rejects.toBe(error);

        mockDBAll.mockRestore();
    });
});


/*********************************GET USERS BY ROLE******************************/

describe("GetUsersByRole", () => {
    test("It should resolve a list of users", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [{username: "username", name: "name", surname: "surname", role: Role.CUSTOMER}])
            return {} as Database
        });
        const result = await userDAO.getUsersByRole(Role.CUSTOMER)
        expect(result).toEqual([{username: "username", name: "name", surname: "surname", role: Role.CUSTOMER}])
        mockDBAll.mockRestore()
    })

    test("It should resolve an empty list", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        });
        const result = await userDAO.getUsersByRole(Role.MANAGER)
        expect(result).toEqual([])
        mockDBAll.mockRestore()
    })

    test("Get users by role - DB Crashed", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            throw new Error("DB Crashed");
        });
        try{
            await userDAO.getUsersByRole(Role.MANAGER)
        }
        catch(e){
            expect(e.message).toBe("DB Crashed")
        }
        finally{
        mockDBAll.mockRestore()
        }
    })

    test("DB Error in getUsersByRole callback", async () => {
        const userDAO = new UserDAO();
        const error = new Error("DB Error");

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(error, null);
            return {} as Database;
        });

        await expect(userDAO.getUsersByRole(Role.MANAGER)).rejects.toBe(error);

        mockDBAll.mockRestore();
    });
})

/*********************************DELETE USER******************************/
describe("Delete User", () => {
    test("It should resolve true", async () => {

        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {username: "username", name: "name", surname: "surname", role: Role.CUSTOMER})
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database;
        });

        const result = await userDAO.deleteUser("username")
        expect(result).toBe(true)

        mockDBRun.mockRestore()
        mockDBGet.mockRestore()
    })

    test("It should reject an UserNotFoundError", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, undefined)
            return {} as Database
        });
        await expect(userDAO.deleteUser("username"))
                    .rejects.toEqual(new UserNotFoundError())
        mockDBGet.mockRestore()
    })

    test("DB Crashed in get", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            throw new Error("DB Crashed");
        });
        try{
            await userDAO.deleteUser("username")
        }
        catch(e){
            expect(e.message).toBe("DB Crashed")
        }
        finally{
        mockDBGet.mockRestore()
        }
    })

    test("DB Error in get callback", async () => {
        const userDAO = new UserDAO();
        const error = new Error("DB Error");

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(error, null);
            return {} as Database;
        });

        await expect(userDAO.deleteUser("username")).rejects.toBe(error);

        mockDBGet.mockRestore();
    });

    test("DB Crashed in run", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {username: "username", name: "name", surname: "surname", role: Role.CUSTOMER})
            return {} as Database
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            throw new Error("DB Crashed");
        });

        try{
            await userDAO.deleteUser("username")
        }
        catch(e){
            expect(e.message).toBe("DB Crashed")
        }
        finally{
        mockDBRun.mockRestore()
        mockDBGet.mockRestore()
        }
    })

    test("DB Error in run callback", async () => {
        const userDAO = new UserDAO();
        const error = new Error("DB Error");

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "name", surname: "surname", role: Role.CUSTOMER });
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });

        await expect(userDAO.deleteUser("username")).rejects.toBe(error);

        mockDBRun.mockRestore();
        mockDBGet.mockRestore();
    });
})

/*********************************DELETE NON ADMIN USER *********************************/
describe("Delete Non Admin User", () => {
    test("It should resolve true", async () => {
        const userDAO = new UserDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await userDAO.deleteNonAdminUsers();
        expect(result).toBe(true);

        mockDBRun.mockRestore();
    });

    test("It should reject if db.run returns an error", async () => {
        const error = new Error("DB Error");
        const userDAO = new UserDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback(error);
            return {} as Database;
        });

        try {
            await userDAO.deleteNonAdminUsers();
        } catch (err) {
            expect(err).toBe(error);
        }

        mockDBRun.mockRestore();
    });

    test("It should reject if an exception is thrown", async () => {
        const error = new Error("DB Crashed");
        const userDAO = new UserDAO();

        const mockDBRun = jest.spyOn(db, "run").mockImplementation(() => {
            throw error;
        });

        try {
            await userDAO.deleteNonAdminUsers();
        } catch (err) {
            expect(err.message).toBe("DB Crashed");
        }

        mockDBRun.mockRestore();
    });

})

/*********************************UPDATE USER******************************/
describe("Update UserInfo", () => {
    test('should update user info successfully', async () => {
        const userDAO = new UserDAO()
        const mockUser = { username: 'testuser', name: 'Test', surname: 'User', role: Role.CUSTOMER, address: '123 Test St', birthdate: '2000-01-01' };
        
        // Mock della funzione getUserByUsername per restituire un utente esistente
        jest.spyOn(userDAO, 'getUserByUsername').mockResolvedValue(mockUser);

        // Mock della funzione db.run per aggiornare l'utente senza errori
        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await userDAO.updateUserInfo('testuser', 'NewName', 'NewSurname', 'New Address', '1990-01-01');
        expect(result).toEqual(mockUser);

        mockDBRun.mockRestore();
    });

    test('should reject if getUserByUsername fails with UserNotFoundError', async () => {
        const error = new UserNotFoundError();
        const userDAO = new UserDAO()

        // Mock della funzione getUserByUsername per restituire un errore
        jest.spyOn(userDAO, 'getUserByUsername').mockRejectedValue(error);

        try {
            await userDAO.updateUserInfo('nonexistentuser', 'NewName', 'NewSurname', 'New Address', '1990-01-01');
        } catch (err) {
            expect(err).toBe(error);
        }
    });

    test('should reject if getUserByUsername fails with general error', async () => {
        const error = new Error('Database error');
        const userDAO = new UserDAO()

        // Mock della funzione getUserByUsername per restituire un errore
        jest.spyOn(userDAO, 'getUserByUsername').mockRejectedValue(error);

        try {
            await userDAO.updateUserInfo('nonexistentuser', 'NewName', 'NewSurname', 'New Address', '1990-01-01');
        } catch (err) {
            expect(err).toBe(error);
        }
    });

    test('should reject if db.run returns an error', async () => {
        const mockUser = { username: 'testuser', name: 'Test', surname: 'User', role: Role.CUSTOMER, address: '123 Test St', birthdate: '2000-01-01' };
        const error = new Error('Database error');
        const userDAO = new UserDAO();

        // Mock della funzione getUserByUsername per restituire un utente esistente
        jest.spyOn(userDAO, 'getUserByUsername').mockResolvedValue(mockUser);

        // Mock della funzione db.run per restituire un errore durante l'aggiornamento
        const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });

        try {
            await userDAO.updateUserInfo('testuser', 'NewName', 'NewSurname', 'New Address', '1990-01-01');
        } catch (err) {
            expect(err).toBe(error);
        }

        mockDBRun.mockRestore();
    });

})


