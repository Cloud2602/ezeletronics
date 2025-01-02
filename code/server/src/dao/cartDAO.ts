import {User, Role} from '../components/user'
import { Product } from '../components/product'
import { Cart, ProductInCart } from '../components/cart'
import db from '../db/db'
import crypto from 'crypto'
import sqlite3 from 'sqlite3'
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError, ProductQuantityError } from '../errors/cartError'
import { ProductNotFoundError, EmptyProductStockError } from '../errors/productError'


/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

   

    //get the cart of a user, total cost of the cart needs to be equal to the total cost of its products, 
    //keeping in mind the quantity of each product, There can be at most one unpaid cart per customer in the database at any moment
    //it should return a promise with the cart of the curret user like this:
    // {customer: "Mario Rossi", paid: false, paymentDate: null, total: 200, products: [{model: "iPhone 13", category: "Smartphone", quantity: 1, price: 200}]}
    //and reject a promise with a CartNotFoundError if the user does not have a cart
    //and reject a promise with a WrongUserCartError if the cart belongs to another user
    //and if the cart is empty it return a promise with an empty cart and reject a promise with an EmptyCartError
    
 
    getCart(user: User, paid:boolean): Promise<Cart> {

        return new Promise<Cart>((resolve, reject) => {
            
            const sql = "SELECT * FROM Cart WHERE customer = ? AND paid = ?"
            db.get(sql, [user.username, paid], (err: Error | null, row: any )=> {
                if (err) {
                     reject(err)
                     console.error("SQL Error:", err);
                }
                if (!row)  { 
                    
                    return resolve(new Cart(user.username, false, null, 0, []));
                    
                 }

                const products: ProductInCart[] = [];
                
                const sql2 = "SELECT * FROM ProductInCart WHERE cartId = ?"

                db.all(sql2, [row.cartId], (err: Error | null, rows: any[]) => {
                    if (err) {
                        console.error("SQL Error (ProductsInCart):", err);
                        return reject(err);
                    }

                    if (!rows || rows.length === 0) {
                        return resolve(new Cart(row.customer, row.paid, row.paymentDate, 0, []));
                    }

                    rows.map((row) => {
                        const product = new ProductInCart(row.model, row.quantity, row.category, row.price);
                        products.push(product);
                        
                    });

                    const cart = new Cart(row.customer, row.paid, row.paymentDate, row.total, products);
                    resolve(cart);
                });
                


                
                
                

            
            })
        })

    }

    /*
    Adds a product instance, identified by the model, to the current cart of the logged in user. 
    In case there is no information about the current unpaid cart of the user, the information should be inserted
    in the database, together with the information about the product. In case there is information about the cart,
    then two scenarios can happen, depending on the product to add: if there is already at least one instance of the product in the cart,
    its amount is increased by one; if there are no instances of the product in the cart, its information is added. 
    The total cost of the cart should be updated with the cost of the product instance.
    Request Parameters: None
    Request Body Content: An object with the following parameters:
    model: a string that cannot be empty
    Example: {model: "iPhone13"}

    Response Body Content: None
    Access Constraints: Can only be called by a logged in user whose role is Customer
    Additional Constraints:

    It should return a 404 error if model does not represent an existing product
    It should return a 409 error if model represents a product whose available quantity is 0
    */

    addToCart(user: User, model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            console.log("Adding product to cart:", model);
    
            const sql = "SELECT * FROM Product WHERE model = ?";
            db.get(sql, [model], (err: Error | null, prod: any) => {
                if (err) {
                    console.error("SQL Error:", err);
                    return reject(err);
                } else if (!prod) {
                    return reject(new ProductNotFoundError());
                } else if (prod.quantity <= 0) {
                    return reject(new EmptyProductStockError());
                } else {
                    const sql2 = "SELECT * FROM Cart WHERE customer = ? AND paid = false";
                    db.get(sql2, [user.username], (err: Error | null, cart: any) => {
                        if (err) {
                            return reject(err);
                        }
    
                        if (!cart) {
                            // Create a new cart if none exists
                            const sql3 = "INSERT INTO Cart (customer, paid, paymentDate, total) VALUES (?, ?, ?, ?)";
                            db.run(sql3, [user.username, false, null, 0], function (err: Error | null) {
                                if (err) {
                                    console.error("SQL Error:", err);
                                    return reject(err);
                                } else {
                                    const newCartId = this.lastID;
                                    console.log("New cart ID:", newCartId);
                                    const sql4 = "SELECT * FROM ProductInCart WHERE cartId = ? AND model = ?";
                                    db.get(sql4, [newCartId, model], (err: Error | null, row: any) => {
                                        if (err) {
                                            return reject(err);
                                        }
                                        if (row) {
                                            console.log("Product already in cart:", row);
                                            db.run("UPDATE ProductInCart SET quantity = quantity + 1 WHERE cartId = ? AND model = ?", [newCartId, model], (err: Error | null) => {
                                                if (err) {
                                                    return reject(err);
                                                }
                                                db.run("UPDATE Cart SET total = total + ? WHERE cartId = ?", [prod.sellingPrice, newCartId], (err: Error | null) => {
                                                    if (err) {
                                                        return reject(err);
                                                    }
                                                    resolve(true);
                                                });
                                            });
                                        } else {
                                            console.log("Product not in cart:", row);
                                            db.run("INSERT INTO ProductInCart (cartId, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)", [newCartId, model, 1, prod.category, prod.sellingPrice], (err: Error | null) => {
                                                if (err) {
                                                    return reject(err);
                                                }
                                                db.run("UPDATE Cart SET total = total + ? WHERE cartId = ?", [prod.sellingPrice, newCartId], (err: Error | null) => {
                                                    if (err) {
                                                        return reject(err);
                                                    }
                                                    resolve(true);
                                                });
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            const cartId = cart.cartId;
                            console.log("Cart ID:", cartId);
                            const sql4 = "SELECT * FROM ProductInCart WHERE cartId = ? AND model = ?";
                            db.get(sql4, [cartId, model], (err: Error | null, row: any) => {
                                if (err) {
                                    return reject(err);
                                }
                                if (row) {
                                    console.log("Product already in cart:", row);
                                    db.run("UPDATE ProductInCart SET quantity = quantity + 1 WHERE cartId = ? AND model = ?", [cartId, model], (err: Error | null) => {
                                        if (err) {
                                            return reject(err);
                                        }
                                        db.run("UPDATE Cart SET total = total + ? WHERE cartId = ?", [prod.sellingPrice, cartId], (err: Error | null) => {
                                            if (err) {
                                                return reject(err);
                                            }
                                            resolve(true);
                                        });
                                    });
                                } else {
                                    db.run("INSERT INTO ProductInCart (cartId, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)", [cartId, model, 1, prod.category, prod.sellingPrice], (err: Error | null) => {
                                        if (err) {
                                            return reject(err);
                                        }
                                        db.run("UPDATE Cart SET total = total + ? WHERE cartId = ?", [prod.sellingPrice, cartId], (err: Error | null) => {
                                            if (err) {
                                                return reject(err);
                                            }
                                            resolve(true);
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    /*
    Simulates payment for the current cart of the logged in user. The payment date of the cart is set to the current date, in format YYYY-MM-DD. 
    The available quantity of products in the cart is reduced by the specified amount. We assume that payment is always successful, and that an order is handled by the store right after checkout.
    Request Parameters: None
    Request Body Content: None
    Response Body Content: None
    Access Constraints: Can only be called by a logged in user whose role is Customer
    Additional Constraints:

    It should return a 404 error if there is no information about an unpaid cart in the database
    It should return a 400 error if there is information about an unpaid cart but the cart contains no product
    It should return a 409 error if there is at least one product in the cart whose available quantity in the stock is 0
    It should return a 409 error if there is at least one product in the cart whose quantity is higher than the available quantity in the stock

    */
    
    checkoutCart(user: User): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            console.log("Checking out cart for user:", user.username);
    
            const sql = "SELECT * FROM Cart WHERE customer = ? AND paid = false";
            db.get(sql, [user.username], (err: Error | null, cart: any) => {
                if (err) {
                    console.error("SQL Error:", err);
                    return reject(err);
                }
                else if (!cart) {
                    return reject(new CartNotFoundError());
                }
                else{
                    const sql2 = "SELECT * FROM ProductInCart WHERE cartId = ?";
                    db.all(sql2, [cart.cartId], (err: Error | null, rows: any[]) => {
                        if (err) {
                            console.error("SQL Error:", err);
                            return reject(err);
                        }
                        else if (!rows || rows.length === 0) {
                            return reject(new EmptyCartError());
                        }
                        else{
                            rows.map((row) => {
                                const sql3 = "SELECT * FROM Product WHERE model = ?";
                                db.get(sql3, [row.model], (err: Error | null, prod: any) => {
                                    //console.log("Product:", prod.quantity, row.quantity);
                                    if (err) {
                                        console.error("SQL Error", err);
                                        return reject(err);
                                    }
                                    else if (!prod) {
                                        return reject(new ProductNotFoundError());
                                    }
                                    else if (prod.quantity === 0) {
                                        return reject(new EmptyProductStockError());
                                    }
                                    else if (prod.quantity < row.quantity) {
                                        return reject(new ProductQuantityError());
                                    }
                                    else{
                                        db.run("UPDATE Product SET quantity = quantity - ? WHERE model = ?", [row.quantity, row.model], (err: Error | null) => {
                                            if (err) {
                                                console.error("SQL Error", err);
                                                return reject(err);
                                            }
                                            else{
                                                const date = new Date().toISOString().slice(0, 10);
                                                db.run("UPDATE Cart SET paid = true, paymentDate = ? WHERE cartId = ?", [date, cart.cartId], (err: Error | null) => {
                                                if (err) {
                                                    console.error("SQL Error", err);
                                                    return reject(err);
                                                }
                                                resolve(true);
                                                });
                                            }

                                        });
                                    }
                                });
                            });
                        }
                    });
                        
                

                        
                }
    
            });
    });
}
    /*
    Returns the history of the carts that have been paid for by the current user.
    The current cart, if present, is not included in the list.
    Request Parameters: None
    Request Body Content: None
    Response Body Content: An array of Cart objects that represents the history of past orders made by the currently logged in user.
    Example: [{customer: "Mario Rossi", paid: true, paymentDate: 2024-05-02, total: 200, products: [{model: "iPhone 13", category: "Smartphone", quantity: 1, price: 200}]}]
    */
    getCustomerCarts(user: User): Promise<Cart[]> {

        return new Promise<Cart[]>((resolve, reject) => {
            console.log("Getting carts for user:", user.username);

            const sql = "SELECT * FROM Cart WHERE customer = ? AND paid = true";
            db.all(sql, [user.username], async (err: Error | null, rows: any[]) => {
                if (err) {
                    console.error("SQL Error:", err);
                    return reject(err);
                }
                const carts: Cart[] = [];
                if (!rows || rows.length === 0) {
                    return resolve(carts);
                }
                for (let row of rows ) {
                    const cart= await this.getCart(user, true);
                    console.log("Cart:", cart);
                    carts.push(cart);

                }

                resolve(carts);
            });

            
    
        });

}

    /*
    Removes an instance of a product from the current cart of the logged in user, reducing its quantity in the cart by one. 
    The total cost of the cart must be reduced by the cost of one product instance.
    It should return a 404 error if model represents a product that is not in the cart
    It should return a 404 error if there is no information about an unpaid cart for the user, or if there is such information but there are no products in the cart
    It should return a 404 error if model does not represent an existing product
    */
    removeProductFromCart(user: User, product: string) :Promise<boolean>  {
        return new Promise<boolean>((resolve, reject) => {
            console.log("Removing product from cart:", product);
    
            const sql = "SELECT * FROM Product WHERE model = ?";
            db.get(sql, [product], (err: Error | null, prod: any) => {
                if (err) {
                    console.error("SQL Error:", err);
                    return reject(err);
                } else if (!prod) {
                    return reject(new ProductNotFoundError());
                } else {
                    const sql2 = "SELECT * FROM Cart WHERE customer = ? AND paid = false";
                    db.get(sql2, [user.username], (err: Error | null, cart: any) => {
                        if (err) {
                            return reject(err);
                        }
    
                        else if (!cart) {
                            return reject(new CartNotFoundError());
                        }
                        else{
                        const cartId = cart.cartId;
                        console.log("Cart ID:", cartId);
                        const sql3 = "SELECT * FROM ProductInCart WHERE cartId=? ";
                        db.get(sql3, [cartId], (err: Error | null, prodcart: any) => {
                            if (err){
                                return reject(err)
                            }
                            else if(!prodcart){
                                return reject(new EmptyCartError)
                            }
                            else{
                                const sql4 = "SELECT * FROM ProductInCart WHERE cartId = ? AND model = ?";
                                db.get(sql4, [cartId, product], (err: Error | null, row: any) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    if (!row) {
                                        return reject(new ProductNotInCartError());
                                    }
                                    if (row.quantity === 1) {
                                        db.run("DELETE FROM ProductInCart WHERE cartId = ? AND model = ?", [cartId, product], (err: Error | null) => {
                                            if (err) {
                                                return reject(err);
                                            }
                                            
                                            db.run("UPDATE Cart SET total = total - ? WHERE cartId = ?", [prod.sellingPrice, cartId], (err: Error | null) => {
                                                if (err) {
                                                    return reject(err);
                                                }
                                                resolve(true);
                                            });
                                            
                                        });
                                    
                                    } else {
                                        db.run("UPDATE ProductInCart SET quantity = quantity - 1 WHERE cartId = ? AND model = ?", [cartId, product], (err: Error | null) => {
                                            if (err) {
                                                return reject(err);
                                            }
                                            db.run("UPDATE Cart SET total = total - ? WHERE cartId = ?", [prod.sellingPrice, cartId], (err: Error | null) => {
                                                if (err) {
                                                    return reject(err);
                                                }
                                                resolve(true);
                                            });
                                        });
                                    }
                                    
                                });
                            }
                        });
                        
                        }
                    });
                }
            });
        });
            


    }

    //Empties the current cart by deleting all of its products. The total cost of the cart must be set to 0.
    //It should return a 404 error if there is no information about an unpaid cart for the user
    clearCart(user: User):Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            console.log("Clearing cart for user:", user.username);
    
            const sql = "SELECT * FROM Cart WHERE customer = ? AND paid = false";
            db.get(sql, [user.username], (err: Error | null, cart: any) => {
                if (err) {
                    console.error("SQL Error:", err);
                    return reject(err);
                }
                else if (!cart) {
                    return reject(new CartNotFoundError());
                }
                else{
                    const cartId = cart.cartId;
                    console.log("Cart ID:", cartId);
                    db.run("DELETE FROM ProductInCart WHERE cartId = ?", [cartId], (err: Error | null) => {
                        if (err) {
                            return reject(err);
                        }
                        db.run("UPDATE Cart SET total = 0 WHERE cartId = ?", [cartId], (err: Error | null) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(true);
                        });
                    });
                }
            });
        });
    

    }

    /*
    Returns all carts of all users, both current and past.
    Response Body Content: An array of Cart objects that represents the carts of all customers in the database
    */
    getAllCarts() :Promise<Cart[]> { 
        return new Promise<Cart[]>((resolve, reject) => {
            console.log("Getting all carts");
    
            const sql = "SELECT * FROM Cart";
            db.all(sql, async (err: Error | null, rows: any[]) => {
                if (err) {
                    console.error("SQL Error:", err);
                    return reject(err);
                }
                const carts: Cart[] = [];
                if (!rows || rows.length === 0) {
                    return resolve(carts);
                }
                for (let row of rows ) {
                    const cart= await this.getCart(new User(row.customer, "", "", Role.CUSTOMER , "", ""), row.paid);
                    
                    carts.push(cart);
                
                    
                }

                

                resolve(carts);
            });

            
    
        });

    }
    
    //Deletes all ProductIncarts.
    //Delete all carts of all users
    deleteAllCarts() :Promise<boolean>  {
        return new Promise<boolean>((resolve, reject) => {
            console.log("Deleting all carts");
    
            const sql = "DELETE FROM ProductInCart";
            db.run(sql, (err: Error | null) => {
                if (err) {
                    console.error("SQL Error:", err);
                    return reject(err);
                }
                const sql2 = "DELETE FROM Cart";
                db.run(sql2, (err: Error | null) => {
                    if (err) {
                        console.error("SQL Error:", err);
                        return reject(err);
                    }
                    resolve(true);
                });
            });
        });
        

    }

    lastID(arg0: string, lastID: any) {
        throw new Error('Method not implemented.')
    }
}



 

export default CartDAO