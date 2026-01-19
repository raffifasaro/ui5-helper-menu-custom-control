service DashService @(path:'/browse') { 

  type OrchestrationResponse : {
    response: String;
    finishReason: String;
    tokenUsage: String;
  }
  
  action callLLM (prompt: String) returns OrchestrationResponse;
}