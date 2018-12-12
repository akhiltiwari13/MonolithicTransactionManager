import request from "request";

const getRequest = (url, body = {}, headers = {}) =>
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

export default getRequest;
