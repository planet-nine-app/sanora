pub mod structs;

#[cfg(test)]
mod tests;

use reqwest::{Client, Response};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sessionless::hex::IntoHex;
use sessionless::{Sessionless, Signature};
use std::time::{SystemTime, UNIX_EPOCH};
use std::collections::HashMap;
use crate::structs::{AddieUser, Order, ProductMeta, SanoraUser, SuccessResult};

pub struct Sanora {
    base_url: String,
    client: Client,
    pub sessionless: Sessionless,
}

impl Sanora {
    pub fn new(base_url: Option<String>, sessionless: Option<Sessionless>) -> Self {
        Sanora {
            base_url: base_url.unwrap_or("https://dev.sanora.allyabase.com/".to_string()),
            client: Client::new(),
            sessionless: sessionless.unwrap_or(Sessionless::new()),
        }
    }

    async fn get(&self, url: &str) -> Result<Response, reqwest::Error> {
        self.client.get(url).send().await
    }

    async fn post(&self, url: &str, payload: serde_json::Value) -> Result<Response, reqwest::Error> {
        self.client
            .post(url)
            .json(&payload)
            .send()
            .await
    }

    async fn put(&self, url: &str, payload: serde_json::Value) -> Result<Response, reqwest::Error> {
        self.client
            .put(url)
            .json(&payload)
            .send()
            .await
    }

    async fn delete(&self, url: &str, payload: serde_json::Value) -> Result<Response, reqwest::Error> {
        self.client
            .delete(url)
            .json(&payload)
            .send()
            .await
    }

    fn get_timestamp() -> String {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_millis()
            .to_string()
    }

    pub async fn create_user(&self) -> Result<SanoraUser, Box<dyn std::error::Error>> {
        let timestamp = Self::get_timestamp();
        let pub_key = self.sessionless.public_key().to_hex();
        let signature = self.sessionless.sign(&format!("{}{}", timestamp, pub_key)).to_hex();
        
        let payload = json!({
            "timestamp": timestamp,
            "pubKey": pub_key,
            "signature": signature
        }).as_object().unwrap().clone();

        let url = format!("{}user/create", self.base_url);
        let res = self.put(&url, serde_json::Value::Object(payload)).await?;
        let user: SanoraUser = res.json().await?;

        Ok(user)
    }

    pub async fn get_user_by_uuid(&self, uuid: &str) -> Result<SanoraUser, Box<dyn std::error::Error>> {
        let timestamp = Self::get_timestamp();
        let message = format!("{}{}", timestamp, uuid);
        let signature = self.sessionless.sign(&message).to_hex();

        let url = format!("{}user/{}?timestamp={}&signature={}", self.base_url, uuid, timestamp, signature);
        let res = self.get(&url).await?;
        let user: SanoraUser = res.json().await?;

        Ok(user)
    }

    pub async fn add_processor_account(&self, uuid: &str, name: &str, email: &str, processor: &str) -> Result<SanoraUser, Box<dyn std::error::Error>> {
        let timestamp = Self::get_timestamp();
        let message = format!("{}{}{}{}", timestamp, uuid, name, email);
        let signature = self.sessionless.sign(&message).to_hex();

        let payload = json!({
            "timestamp": timestamp,
            "name": name,
            "email": email,
            "signature": signature
        }).as_object().unwrap().clone();

        let url = format!("{}user/{}/processor/{}", self.base_url, uuid, processor);
        let res = self.put(&url, serde_json::Value::Object(payload)).await?;
        let user: SanoraUser = res.json().await?;

        Ok(user)
    }

    pub async fn add_product(&self, uuid: &str, title: &str, description: &str, price: &u32) -> Result<ProductMeta, Box<dyn std::error::Error>> {
        let timestamp = Self::get_timestamp();
        let message = format!("{}{}{}{}{}", timestamp, uuid, title, description, price);
        let signature = self.sessionless.sign(&message).to_hex();

        let payload = json!({
            "timestamp": timestamp,
            "description": description,
            "price": price,
            "signature": signature
        }).as_object().unwrap().clone();

        let url = format!("{}user/{}/product/{}", self.base_url, uuid, title);
        let res = self.put(&url, serde_json::Value::Object(payload)).await?;
        let meta: ProductMeta = res.json().await?;

        Ok(meta)
    }

    pub async fn add_order(&self, uuid: &str, order: &Order) -> Result<SanoraUser, Box<dyn std::error::Error>> {
        let timestamp = Self::get_timestamp();
        let message = format!("{}{}", timestamp, uuid);
        let signature = self.sessionless.sign(&message).to_hex();

        let payload = json!({
            "timestamp": timestamp,
            "order": order,
            "signature": signature
        }).as_object().unwrap().clone();

        let url = format!("{}user/{}/orders", self.base_url, uuid);
        let res = self.put(&url, serde_json::Value::Object(payload)).await?;
        let user: SanoraUser = res.json().await?;

        Ok(user)
    }

    /*pub async fn put_artifact_for_product(&self, uuid: &str, title: &str, artifact: &str) -> Result<SuccessResult, Box<dyn std::error::Error>> {
        // TODO: in tauri, uploading of files happens via the web side, and not the rust side, so punting on this for now.
    }

    pub async fn put_image_for_product(&self, uuid: &str, title: &str, image: &str) -> Result<SuccessResult, Box<dyn std::error::Error>> {
       // TODO: in tauri, uploading of files happens via the web side, and not the rust side, so punting on this for no
w.  
    }*/

    // TODO: The rest lol


/*    pub async fn delete_user(&self, uuid: &str) -> Result<SuccessResult, Box<dyn std::error::Error>> {
        let timestamp = Self::get_timestamp();
        let message = format!("{}{}", timestamp, uuid);
        let signature = self.sessionless.sign(&message).to_hex();

        let payload = json!({
          "timestamp": timestamp,
          "uuid": uuid,
          "signature": signature
        }).as_object().unwrap().clone();

        let url = format!("{}user/{}", self.base_url, uuid);
        let res = self.delete(&url, serde_json::Value::Object(payload)).await?;
        let success: SuccessResult = res.json().await?;

        Ok(success)
    }*/

}
