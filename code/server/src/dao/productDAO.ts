import db from '../db/db';
import {Product} from '../components/product';
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError, InvalidInput, SellingAfterCurrentError, SellingBeforeArrivalError, ArrivalAfterCurrentError } from '../errors/productError';
import { inflateRawSync } from 'zlib';
/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
    
     /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
    /* - Additional Constraints:
     - It should return a 409 error if `model` represents an already existing set of products in the database

     - Request Body Content: An object with the following parameters:
  - `model`: a string that must not be empty
  - `category`: a string whose value can only be one of ["Smartphone", "Laptop", "Appliance"]
  - `quantity`: an integer value that must be greater than 0. Represents the instances of the product that have arrived (e.g. 5 distinct iPhone 13 all count as a single arrival)
  - `details`: a string that can be empty
  - `sellingPrice`: a floating point number whose value is greater than 0. Represents the price at which a single instance of the product is sold to customers.
  - `arrivalDate`: an optional string that represents a date. If present, it must be in the format **YYYY-MM-DD**. If absent, then the current date is used as the arrival date for the product, in the same format.*/
    registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
            
        return new Promise<void>((resolve, reject) => {
            const query = `INSERT INTO Product (model, category, quantity, details, sellingPrice, arrivalDate) VALUES (?, ?, ?, ?, ?, ?)`
            const currentDate = new Date().toISOString().split('T')[0]

            db.get(`SELECT * FROM Product WHERE model = ?`, [model], (err: Error | null, row: any) => {
                if(err) {
                    reject(err)  
                } else if(row) {
                    reject(new ProductAlreadyExistsError())
                } else if ( !model || !category || !quantity || quantity < 1 || !sellingPrice || sellingPrice < 1) {
                    reject(new InvalidInput())
                } else if ( arrivalDate > currentDate ) {
                    reject(new ArrivalAfterCurrentError())
                } else {

                    arrivalDate = arrivalDate || currentDate;
                    db.run(query, [model, category, quantity, details, sellingPrice, arrivalDate], (err: Error | null) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve()
                        }
                    })
                }
            })
    
        })
    }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    /*- Additional Constraints:
  - It should return a 404 error if `model` does not represent a product in the database
  - It should return a 400 error if `changeDate` is after the current date
  - It should return a 400 error if `changeDate` is before the product's `arrivalDate`*/

    changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {
        return new Promise((resolve, reject) => {
            const query = `UPDATE Product SET quantity = quantity + ? WHERE model = ?`
            const currentDate = new Date().toISOString().split('T')[0]
            
            db.get(`SELECT arrivalDate FROM Product WHERE model = ?`, [model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err)
                } else if (!row) {
                    reject(new ProductNotFoundError())
                } else if (changeDate > currentDate) {
                    reject(new Error('The change date cannot be after the current date'))
                } else if (changeDate < row.arrivalDate) {
                    reject(new Error('The change date cannot be before the arrival date'))
                } else {
                    db.run(query, [newQuantity, model, ], (err: Error | null) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(newQuantity)
                        }
                    })
                }
            })
        })
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */

    /* - Additional Constraints:
    - It should return a 404 error if `model` does not represent a product in the database
    - It should return a 400 error if `sellingDate` is after the current date
    - It should return a 400 error if `sellingDate` is before the product's `arrivalDate`
    - It should return a 409 error if `model` represents a product whose available quantity is 0
    - It should return a 409 error if the available quantity of `model` is lower than the requested `quantity` */

    sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> {
        return new Promise((resolve, reject) => {
            const query = `UPDATE Product SET quantity = quantity - ? WHERE model = ?`
            const currentDate = new Date().toISOString().split('T')[0];

            db.get(`SELECT arrivalDate, quantity FROM Product WHERE model = ?`, [model], (err: Error | null, row: any) => {
            if (sellingDate > currentDate) {
                reject(new SellingAfterCurrentError())
            }
            else if(!row)
            {
                reject(new ProductNotFoundError())
            }
            else if (row.quantity === 0) {
                reject(new EmptyProductStockError())
            }
            else if (row.quantity < quantity) {
                reject(new LowProductStockError())
            }
            else if(sellingDate < row.arrivalDate) {
                reject(new SellingBeforeArrivalError())
            }

            else {
                db.run(query, [quantity, model], (err: Error | null) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(quantity)
                    }
                })
            }
            })
        })
    }

    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    /*- Additional Constraints:
  - It should return a 422 error if `grouping` is null and any of `category` or `model` is not null
  - It should return a 422 error if `grouping` is `category` and `category` is null OR `model` is not null
  - It should return a 422 error if `grouping` is `model` and `model` is null OR `category` is not null
  - It should return a 404 error if `model` does not represent a product in the database (only when `grouping` is `model`)*/

    getProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM Product`
            
            db.get(`SELECT * FROM Product WHERE model = ?`, [model], (err: Error | null, row: any) => {

            if (grouping === 'category' && category) {
                query += ` WHERE category = '${category}'`
            } else if (grouping === 'model' && model) {
                query += ` WHERE model = '${model}'`
            }

            if(!grouping && (category || model)) {
                reject(new Error('Grouping is null and either category or model is not null'))
            }
            else if(grouping === 'category' && (!category || model)) {
                reject(new Error('Grouping is category and category is null or model is not null'))
            }
            else if(grouping === 'model' && (!model || category)) {
                reject(new Error('Grouping is model and model is null or category is not null'))
            }
            else if (err) {
                reject(new ProductNotFoundError)
            }
            else {
                db.all(query, (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                })
            }
        })
        }) 
    }

    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */

    /*- Additional Constraints:
  - It should return a 422 error if `grouping` is null and any of `category` or `model` is not null
  - It should return a 422 error if `grouping` is `category` and `category` is null OR `model` is not null
  - It should return a 422 error if `grouping` is `model` and `model` is null OR `category` is not null
  - It should return a 404 error if `model` does not represent a product in the database (only when `grouping` is `model`)*/

    getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM Product WHERE quantity > 0`
            db.get(`SELECT * FROM Product WHERE model = ?`, [model], (err: Error | null, row: any) => {
            if (grouping === 'category' && category) {
                query += ` AND category = '${category}'`
            } else if (grouping === 'model' && model) {
                query += ` AND model = '${model}'`
            }
            if(!grouping && (category || model)) {
                reject(new Error('Grouping is null and either category or model is not null'))
            }
            else if(grouping === 'category' && (!category || model)) {
                reject(new Error('Grouping is category and category is null or model is not null'))
            }
            else if(grouping === 'model' && (!model || category)) {
                reject(new Error('Grouping is model and model is null or category is not null'))
            }
            else if (err) {
                reject(new ProductNotFoundError)
            }
            else {
                db.all(query, (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                })
            }

            })
        }) 
    }

    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */

    /*- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager*/

    deleteAllProducts(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM Product`

            db.run(query, (err: Error | null) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(true)
                }
            })
        })
    }

    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    /*- Additional Constraints:
  - It should return a 404 error if `model` does not represent a product in the database*/

    deleteProduct(model: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM Product WHERE model = ?`
            db.get(`SELECT * FROM Product WHERE model = ?`, [model], (err: Error | null, row: any) => {
            if (!row) {
                reject(new ProductNotFoundError)
            }
            else {
                db.run(query, [model], (err: Error | null) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(true)
                    }
                })
            }
            })
        })
    }
}

export default ProductDAO