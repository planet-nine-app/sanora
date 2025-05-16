use crate::{AddieUser, Order, ProductMeta, Sanora, SanoraUser, SuccessResult};
use sessionless::hex::IntoHex;
use std::collections::HashMap;
use serde_json::json;
use serde_json::Value;
use rand::Rng;

#[actix_rt::test]
async fn test_sanora() {

    let mut saved_user: Option<SanoraUser>;
    let sanora = Sanora::new(Some("http://localhost:7243/".to_string()), None);

    async fn create_user(sanora: &Sanora) -> Option<SanoraUser> {
	let result = sanora.create_user().await;

	match result {
	    Ok(user) => {
		println!("Successfully got SanoraUser: {}", user.uuid);
		assert_eq!(
		    user.uuid.len(),
		    36
		);
                Some(user)
	    },
	    Err(error) => {
		eprintln!("Error occurred create_user: {}", error);
		println!("Error details: {:?}", error);
                None
	    }
	}
    }

    async fn get_user_by_uuid(sanora: &Sanora, saved_user: &SanoraUser) -> Option<SanoraUser> {
	let result = sanora.get_user_by_uuid(&saved_user.uuid).await; 
     
	match result {
	    Ok(user) => {
		assert_eq!(
		    user.uuid.len(),
		    36
		);
                Some(user)
	    }
	    Err(error) => {
		eprintln!("Error occurred get_user: {}", error);
		println!("Error details: {:?}", error);
                None
	    }
	} 
    }

/*    async fn add_processor_account(sanora: &Sanora, saved_user: &SanoraUser) -> Option<SanoraUser> {
        let email_seed: u32 = rand::thread_rng().gen_range(0..100000);
        let email: String = format!("zach+{}@planetnine.app", &email_seed);
        let result = sanora.add_processor_account(&saved_user.uuid, "Foo", &email).await;

        match result {
            Ok(user) => {
                assert_eq!(
                    user.uuid.len(),
                    36
                );
                Some(user)
            }
            Err(error) => {
                eprintln!("Error occurred get_user: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        } 
    }*/

    async fn add_product(sanora: &Sanora, saved_user: &SanoraUser) -> Option<ProductMeta> {
        let title = "My rust title".to_string();
        let description = "Here is a description of my sweet product".to_string();
        let price = 2000;
  
        let result = sanora.add_product(&saved_user.uuid, &title, &description, &price).await;

        match result {
            Ok(meta) => {
               assert_eq!(
                    meta.uuid.len(),
                    36
                );
                Some(meta)
            }
            Err(error) => {
                eprintln!("Error occured adding product: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        }
    }

    async fn add_order(sanora: &Sanora, saved_user: &SanoraUser) -> Option<SanoraUser> {
        let productId = "foo-bar-baz".to_string();
        let address1 = "123 A Ave".to_string();
        let city = "Portland".to_string();
        let state = "OR".to_string();
        let zipCode = "12345".to_string();

        let order = Order {
          productId,
          address1: Some(address1),
          address2: None,
          city: Some(city),
          state: Some(state),
          zipCode: Some(zipCode)
        };
  
        let result = sanora.add_order(&saved_user.uuid, &order).await;

        match result {
            Ok(meta) => {
               assert_eq!(
                    meta.uuid.len(),
                    36
                );
                Some(meta)
            }
            Err(error) => {
                eprintln!("Error occured adding product: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        }
    }



/*

    async fn get_payment_intent(sanora: &Sanora, saved_user: &SanoraUser) -> Option<PaymentIntent> {
        let payees: Vec<String> = Vec::new();
        let result = sanora.get_payment_intent(&saved_user.uuid, "stripe", &2000, "USD", &payees).await;

        match result {
            Ok(intent) => {
                assert_eq!(
                    intent.customer.len(),
                    18
                );
                Some(intent)
            }
            Err(error) => {
                eprintln!("Error occurred get_user: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        }
    }

    async fn get_payment_intent_without_splits(sanora: &Sanora, saved_user: &SanoraUser) -> Option<PaymentIntent> {
        let result = sanora.get_payment_intent_without_splits(&saved_user.uuid, "stripe", &2000, "USD").await;

        match result {
            Ok(intent) => {
                assert_eq!(
                    intent.customer.len(),
                    18
                );
                Some(intent)
            }
            Err(error) => {
                eprintln!("Error occurred get_user: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        }
    }

    async fn delete_user(sanora: &Sanora, saved_user: &SanoraUser) -> Option<SuccessResult> {
        let result = sanora.delete_user(&saved_user.uuid).await;

        match result {
            Ok(success) => {
                assert_eq!(
                    success.success,
                    true
                );
                Some(success)
            }
            Err(error) => {
                eprintln!("Error occurred delete: {}", error);
                println!("Error details: {:?}", error);
                None
            }
        }
    }*/

    saved_user = Some(create_user(&sanora).await.expect("user"));

    if let Some(ref user) = saved_user {
        saved_user = Some(get_user_by_uuid(&sanora, user).await.expect("get user 1"));
    } else {
        panic!("Failed to get user");
    }

    if let Some(ref user) = saved_user {
        Some(add_product(&sanora, user).await.expect("add product"));
    } else {
        panic!("Failed to add product");
    }


/*    if let Some(ref user) = saved_user {
	Some(add_processor_account(&sanora, user).await.expect("add processor"));
        saved_user = Some(get_user_by_uuid(&sanora, user).await.expect("adding processor account"));
    } else {
	panic!("Failed to add processor account");
    }

    if let Some(ref user) = saved_user {
        Some(get_payment_intent(&sanora, user).await.expect("get payment intent"));
        saved_user = Some(get_user_by_uuid(&sanora, user).await.expect("getting payment intent"));
    } else {
        panic!("Failed to get payment intent");
    }

    if let Some(ref user) = saved_user {
        Some(get_payment_intent_without_splits(&sanora, user).await.expect("get payment intent without splits"));
        saved_user = Some(get_user_by_uuid(&sanora, user).await.expect("getting payment intent"));
    } else {
        panic!("Failed to get payment intent");
    }
    
    if let Some(ref user) = saved_user {
	delete_user(&sanora, &user).await;
    } else {
	panic!("Failed to delete user");
    } */    
}
