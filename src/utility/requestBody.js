const prepareBody = (bodyParams) => {
    return {"jsonrpc": "2.0", "method": "call", "params": bodyParams, "id":1};
}

export default prepareBody;
// [0, "get_account_balances", ["1.2.17", ["1.3.0"]]]
// [0, "lookup_account_names", [["nathan"]]] ==> body for getting account id of the account.
