import db from "../db/db"
import { User } from "../components/user";
import { ProductReview } from "../components/review";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import { ProductNotFoundError } from "../errors/productError";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    addReview(model: string, user: User, score: number, comment: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try{
                const checkExistingProduct = "SELECT * FROM Product WHERE model = ? "
                db.get(checkExistingProduct, [model], (err: Error | null, row: any) => {
                    if(err)
                        {
                            reject(err);
                            return;
                        }
                    if(!row)
                        {
                            reject(new ProductNotFoundError);
                            return;
                        }
                }) 

                const checkExistingReview = "SELECT * FROM ProductReview WHERE model = ? AND user = ?"
                db.get(checkExistingReview, [model, user.username], (err: Error | null, row: any) => {
                    if(err){
                        reject(err);
                    }
                    if(row) {
                        reject(new ExistingReviewError);
                    }
                })
                const sql = "INSERT INTO ProductReview (model, user, score, date, comment) VALUES (?, ?, ?, CURRENT_DATE, ?)"
                db.run(sql, [model, user.username, score, comment], (err: Error | null) => {
                    console.log(user);
                    if(err) {
                        reject(err);
                    }
                     else {
                        resolve();
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            
                const sql = "SELECT * FROM ProductReview WHERE model = ?"
                db.all(sql, [model], (err: Error | null, rows: any[]) => {
                    if(err) {
                        reject(err);
                    } else {
                        const reviews: ProductReview[] = []
                        for(const row of rows) {
                            reviews.push(new ProductReview(row.model, row.user, row.score, row.date, row.comment));
                        }
                        resolve(reviews);
                    }
                })
            
        })
    }
/*- Additional Constraints:
  - It should return a 404 error if `model` does not represent a product in the database
  - It should return a 404 error if the current user does not have a review for the product identified by model
  */
        
    deleteReview(model: string, user: User): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try{
                const checkExistingProduct = "SELECT * FROM Product WHERE model = ? "
                db.get(checkExistingProduct, [model], (err: Error | null, row: any) => {
                    if(err)
                        {
                            reject(err);
                            return;
                        }
                    if(!row)
                        {
                            reject(new ProductNotFoundError);
                            return;
                        }
                }) 

                const checkExistingReview = "SELECT * FROM ProductReview WHERE model = ? AND user = ?"
                db.get(checkExistingReview, [model, user.username], (err: Error | null, row: any) => {
                    if(err){
                        reject(err);
                    }
                    if(row) {
                        reject(new ExistingReviewError);
                    }
                })

                const sql = "DELETE FROM ProductReview WHERE model = ? AND user = ?"
                db.run(sql, [model, user.username], (err: Error | null) => {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            })
            } catch(error) {
                reject(error)
            }
        })
    }

    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try{
                const checkExistingProduct = "SELECT * FROM Product WHERE model = ? "
                db.get(checkExistingProduct, [model], (err: Error | null, row: any) => {
                    if(err)
                        {
                            reject(err);
                            return;
                        }
                    if(!row)
                        {
                            reject(new ProductNotFoundError);
                            return;
                        }
                }) 
                const sql = "DELETE FROM ProductReview WHERE model = ?"
                db.run(sql, [model], (err: Error | null) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            } catch(error) {
                reject(error)
            }
        })
    }

    deleteAllReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try{
                const sql = "DELETE FROM ProductReview"
                db.run(sql, (err: Error | null) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            } catch(error) {
                reject(error)
            }
        })
    }

}

export default ReviewDAO;