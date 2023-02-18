const data = {
  chatGPTTimeout: {
    base_resp: {
      ret: 102002,
      errmsg: "请求超时",
    },
  },
  chatGPTSuccess: {
    data: {
      role: "assistant",
      id: "cmpl-6kWYwkLeDv8LfLXcBNzXNPNdDucCH",
      parentMessageId: "e2fb72a5-d2a8-410a-8dda-013b2e52dea2",
      conversationId: "6d83626c-726f-4ae2-9a0d-c6ed2bdcc7d9",
      text: "2",
      detail: {
        id: "cmpl-6kWYwkLeDv8LfLXcBNzXNPNdDucCH",
        object: "text_completion",
        created: 1676546278,
        model: "text-davinci-003",
        choices: [
          {
            text: "\n2",
            index: 0,
            logprobs: null,
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 61,
          completion_tokens: 2,
          total_tokens: 63,
        },
      },
    },
    header: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
      "X-CloudBase-Request-Id": "4c65e376c131417a986af7af4ba31c53",
      server: "nginx/1.17.8",
      date: "Thu, 16 Feb 2023 11:17:59 GMT",
      "content-type": "application/json; charset=utf-8",
      vary: "Accept-Encoding",
      "x-powered-by": "Express",
      etag: 'W/"1cb-ofKrb2sDJOBgrtgVmc5AzcyaVJA"',
      "x-cloudbase-upstream-status-code": "200",
      "X-CloudBase-Upstream-TimeCost": "1281",
      "x-wx-call-id": "0.7320950346479209_1676546277869",
      "x-wx-server-timing": "1676546278077,1676546279470",
      "Access-Control-Expose-Headers": "x-wx-call-id, x-wx-server-timing",
      Connection: "keep-alive",
      "Content-Encoding": "gzip",
      "Content-Length": "314",
    },
    statusCode: 200,
    cookies: [],
    errMsg: "request:ok",
  },
};

module.exports = data;
