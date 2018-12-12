import request from "request";

export const getRequest = (url, body = {}, headers = {}) =>
  new Promise((resolve, reject) =>
    request.get(
      {
        method: "GET",
        url,
        headers,
        json: body
      },
      (error, response, body) => {
        if (error) reject(error);
        resolve(body);
      }
    )
  );

  export const postRequest = (url, body, headers = {"Content-Type": "application/json"}) =>
  new Promise((resolve, reject) =>
    request.post(
      {
        method: "POST",
        url,
        headers,
        json: body
      },
      (error, response,body) => {
        if (error) reject(error);
        resolve(body);
      }
    )
  );

