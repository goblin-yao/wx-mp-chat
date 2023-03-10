const data = {
  chatAITimeout1: {
    base_resp: {
      ret: 102002,
      errmsg: "请求超时",
    },
  },
  chatAITimeout: {
    data: {
      base_resp: {
        ret: 102002,
        errmsg: "请求超时",
      },
    },
    header: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
      "x-wx-system-error": "102002",
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-cache, must-revalidate",
      RetKey: "11",
      LogicRet: "102002",
      "x-wx-call-id": "0.8370317322430423_1677169862227",
      "x-wx-server-timing": "1677169862285,1677169877358",
      "Access-Control-Expose-Headers":
        "x-wx-system-error, x-wx-call-id, x-wx-server-timing",
      Connection: "keep-alive",
      "Content-Length": "52",
    },
    statusCode: 200,
    cookies: [],
    errMsg: "request:ok",
  },
  chatAIInnerError: {
    data: {
      error: {
        statusCode: -1,
        data: "服务内部错误",
      },
    },
    header: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
      "X-CloudBase-Request-Id": "0a1f17e853851ecca39f203d2e63778f",
      server: "nginx/1.17.8",
      date: "Thu, 02 Mar 2023 14:36:10 GMT",
      "content-type": "application/json; charset=utf-8",
      "x-powered-by": "Express",
      etag: 'W/"37-PmWL/sTcRk73ga5IwUVlRe4ffAE"',
      "x-cloudbase-upstream-status-code": "200",
      "X-CloudBase-Upstream-TimeCost": "240",
      "x-wx-call-id": "0.6367847680545042_1677767769792",
      "x-wx-server-timing": "1677767770117,1677767770437",
      "Access-Control-Expose-Headers": "x-wx-call-id, x-wx-server-timing",
      Connection: "keep-alive",
      "Content-Length": "55",
    },
    statusCode: 200,
    cookies: [],
    errMsg: "request:ok",
  },
  chatAISuccess: {
    data: {
      role: "assistant",
      id: "cmpl-6kWYwkLeDv8LfLXcBNzXNPNdDucCH",
      parentMessageId: "e2fb72a5-d2a8-410a-8dda-013b2e52dea2",
      conversationId: "6d83626c-726f-4ae2-9a0d-c6ed2bdcc7d9",
      text: "chatai生成的记录消息",
      // text: "要强化基础研究前瞻性、战略性、系统性布局。基础研究处于从研究到应用、再到生产的科研链条起始端，地基打得牢，科技事业大厦才能建得高。要坚持“四个面向”，坚持目标导向和自由探索“两条腿走路”，把世界科技前沿同国家重大战略需求和经济社会发展目标结合起来，统筹遵循科学发展规律提出的前沿问题和重大应用研究中抽象出的理论问题，凝练基础研究关键科学问题。要把握科技发展趋势和国家战略需求，加强基础研究重大项目可行性论证和遴选评估，充分尊重科学家意见，把握大趋势、下好“先手棋”。要强化国家战略科技力量，有组织推进战略导向的体系化基础研究、前沿导向的探索性基础研究、市场导向的应用性基础研究，注重发挥国家实验室引领作用、国家科研机构建制化组织作用、高水平研究型大学主力军作用和科技领军企业“出题人”、“答题人”、“阅卷人”作用。要优化基础学科建设布局，支持重点学科、新兴学科、冷门学科和薄弱学科发展，推动学科交叉融合和跨学科研究，构筑全面均衡发展的高质量学科体系",
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
  chatHistory: {},
  chatAIErrorToken: {
    data: {
      question: "请规划一次双月湾团建活动，时间3月25日26日",
      error: {
        statusCode: 400,
        data: {
          error: {
            message:
              "This model's maximum context length is 2049 tokens, however you requested 2062 tokens (62 in your prompt; 2000 for the completion). Please reduce your prompt; or completion length.",
            type: "invalid_request_error",
            param: null,
            code: null,
          },
        },
      },
    },
    header: {
      "Content-Length": "369",
      "Content-Type": "application/json; charset=utf-8",
      Date: "Fri, 03 Mar 2023 09:54:34 GMT",
      ETag: 'W/"171-Cwmmzb1d6/TALLwWz4SzadGGV8A"',
      "Set-Cookie":
        "ARRAffinity=f8425e22e55f7700616eb13548eef96fe6407f656f273545becd10a64bdf978c;Path=/;HttpOnly;Secure;Domain=wxchatnodeexpressazure.azurewebsites.net,ARRAffinitySameSite=f8425e22e55f7700616eb13548eef96fe6407f656f273545becd10a64bdf978c;Path=/;HttpOnly;SameSite=None;Secure;Domain=wxchatnodeexpressazure.azurewebsites.net",
      "X-Powered-By": "Express",
    },
    statusCode: 200,
    cookies: [
      "ARRAffinity=f8425e22e55f7700616eb13548eef96fe6407f656f273545becd10a64bdf978c;Path=/;HttpOnly;Secure;Domain=wxchatnodeexpressazure.azurewebsites.net",
      "ARRAffinitySameSite=f8425e22e55f7700616eb13548eef96fe6407f656f273545becd10a64bdf978c;Path=/;HttpOnly;SameSite=None;Secure;Domain=wxchatnodeexpressazure.azurewebsites.net",
    ],
    errMsg: "request:ok",
  },
};

module.exports = data;
