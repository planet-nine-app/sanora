use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all="camelCase")]
pub struct AddieUser {
    #[serde(default)]
    pub pub_key: String,
    pub uuid: String,
    #[serde(rename = "stripeAccountId")]
    #[serde(default)]
    pub stripe_account_id: String
}

impl Default for AddieUser {
    fn default() -> Self {
        AddieUser {
            pub_key: "".to_string(),
            uuid: "".to_string(),
            stripe_account_id: "".to_string()
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all="camelCase")]
pub struct SanoraUser {
    #[serde(default)]
    pub pub_key: String,
    pub uuid: String,
    #[serde(rename = "addieUser")]
    #[serde(default)]
    pub addie_user: AddieUser 
}

impl Default for SanoraUser {
    fn default() -> Self {
        SanoraUser {
            pub_key: "".to_string(),
            uuid: "".to_string(),
            addie_user: AddieUser::default()
        }   
    }   
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProductMeta {
    pub uuid: String, 
    pub title: String,
    pub description: String,
    pub price: u32,
    pub artifacts: Vec<String>
}

impl Default for ProductMeta {
    fn default() -> Self {
        ProductMeta {
            uuid: "".to_string(),
            title: "".to_string(),
            description: "".to_string(),
            price: 0,
            artifacts: Vec::<String>::new()
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SuccessResult {
    pub success: bool
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all="camelCase")]
pub struct PaymentIntent {
    pub payment_intent: String,
    pub ephemeral_key: String,
    pub customer: String,
    pub publishable_key: String
}

impl PaymentIntent {
    pub fn new() -> Self {
        PaymentIntent {
            payment_intent: "".to_string(),
            ephemeral_key: "".to_string(),
            customer: "".to_string(),
            publishable_key: "".to_string()
        }
    }
}

