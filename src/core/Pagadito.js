import axios from 'axios';
import { parse } from 'fast-xml-parser';
import * as WebBrowser from 'expo-web-browser';

class Pagadito {

    static instance = null;
    uid;
    wsk;
    apipg;
    apipg_sandbox;
    response;
    sandbox_mode;
    details;
    currency;
    allow_pending_payments;
    extended_expiration;
    token_trans;

    constructor(uid, wsk) {
        this.uid = uid;
        this.wsk = wsk;
        this.config();
        this.add_detail(1, "test1", 3, "");
        this.add_detail(1, "test2", 2, "");
        this.add_detail(2, "test3", 1, "");

    }

    connect = async () => {
        const params = {
            uid: this.uid,
            wsk: this.wsk,
            format_return: this.format_return
        };
        const actionName = 'connect';
        const xml = this.createXmlRequest(actionName, params);
        this.response = await this.call(actionName, xml);
        console.log("connect reponse", this.response);
        if (this.get_rs_code() === 'PG1001') {
            return true;
        }
        return false;
    }

    ern = () => {
        return Math.floor(Math.random() * (2000 - 1000)) + 1000;
    }

    exec_trans = async () => {
        console.log('Details', JSON.stringify(this.details))
        if (this.get_rs_code() === 'PG1001') {
            const params = {
                token: this.get_rs_value(),
                ern: this.ern(),
                amount: this.calc_amount(),
                details: JSON.stringify(this.details),
                format_return: this.format_return,
                currency: this.currency,
                allow_pending_payments: this.allow_pending_payments,
                extended_expiration: this.extended_expiration
            };
            this.token_trans = this.get_rs_value();
            const actionName = 'exec_trans';
            const xml = this.createXmlRequest(actionName, params);
            // console.log('XML', xml);
            this.response = await this.call(actionName, xml);
            console.log("exec_trans response", this.response);
            if (this.get_rs_code() === 'PG1002') {
                let result = await WebBrowser.openBrowserAsync(this.get_rs_value());
                // console.log({ result });
                return true;
            }
        }
        return false;
    }

    get_status = async () => {
        if (this.get_rs_code() == 'PG1001') {
            const params = {
                token: this.get_rs_value(),
                token_trans: this.token_trans,
                format_return: this.format_return
            };
            const actionName = 'get_status';
            const xml = this.createXmlRequest(actionName, params);
            this.response = await this.call(actionName, xml);
            console.log("get_status response", this.response);
            if (this.get_rs_code() == "PG1003") {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }

    call = async (actionName, xml) => {
        try {
            const url = this.sandbox_mode ? this.apipg_sandbox : this.apipg;
            const response = await axios.post(url, xml, { headers: { 'Content-Type': 'text/xml', SOAPAction: '' } });
            return this.decodeResponse(response, actionName);
        } catch (ex) {
            console.log(ex);
        }
    }

    decodeResponse = (response, actionName) => {
        const responseJson = parse(response.data);
        return JSON.parse(responseJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'][`ns1:${actionName}Response`]['return'].replaceAll("&quot;", '"').replaceAll("&amp;", '&'));
    }

    createXmlRequest = (actionName, paramsObject) => {
        let params = ''
        for (const key in paramsObject) {
            params += `<${key}>${paramsObject[key]}</${key}>`
        }
        return `<?xml version='1.0' encoding='utf-8'?><soap:Envelope xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'><soap:Body><${actionName} xmlns='urn:https://sandbox.pagadito.com/comercios/wspg/charges'>${params}</${actionName}></soap:Body></soap:Envelope>`
    }

    config = () => {
        this.apipg = 'https://comercios.pagadito.com/apipg/charges.php?wsdl';
        this.apipg_sandbox = 'https://sandbox.pagadito.com/comercios/wspg/charges.php?wsdl';
        this.format_return = 'JSON';
        this.sandbox_mode = true;
        this.details = [];
        this.currency = 'USD';
        this.allow_pending_payments = 'FALSE';
        this.extended_expiration = 'FALSE';
    }

    calc_amount = () => {
        let amount = 0;
        for (const key in this.details) {
            amount += this.details[key]['price'] * this.details[key]['quantity'];
        };
        return amount;
    }

    add_detail = (quantity, description, price, url_product = "") => {
        this.details.push({
            'quantity': quantity,
            'description': description,
            'price': price,
            'url_product': url_product
        });
    }

    get_rs_code = () => this.return_attr_response('code');

    get_rs_value = () => this.return_attr_response('value');

    get_rs_status = () => this.return_attr_value('status');

    get_rs_reference = () => this.return_attr_value('reference');

    return_attr_response = (name) => this.isObject(this.response) && this.response.hasOwnProperty(name) ?
        this.response[name] :
        null;

    return_attr_value = (name) => this.isObject(this.response['value']) && this.response['value'].hasOwnProperty(name) ?
        this.response['value'][name] :
        null;

    isObject = (obj) => {
        return obj != null && obj.constructor.name === 'Object'
    }


}

export default Pagadito;