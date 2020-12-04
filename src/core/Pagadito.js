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
    extended_expiration

    constructor(uid, wsk) {
        this.uid = uid;
        this.wsk = wsk;
        this.config();
    }

    connect = async () => {
        const params = {
            uid: this.uid,
            wsk: this.wsk,
            format_return: this.format_return
        };
        const actionName ='connect';
        const xml = this.createXmlRequest(actionName, params);
        this.response = await this.call(actionName, xml);
        console.log(this.response);
        if (this.get_rs_code() === 'PG1001') {
            return true;
        }
        return false;
    }

    exec_trans = async () => {
        if (this.get_rs_code() === 'PG1001') {
            const params = {
                token: this.get_rs_value(),
                ern: 1234,
                amount: 6.25,
                details: JSON.stringify(this.details),
                format_return: this.format_return,
                currency: this.currency,
                allow_pending_payments: this.allow_pending_payments,
                extended_expiration: this.extended_expiration
            };
            const actionName = 'exec_trans';
            const xml = this.createXmlRequest(actionName, params);
            console.log('XML', xml);
            this.response = await this.call(actionName, xml);
            console.log(this.response);
            if (this.get_rs_code() === 'PG1002') {
                let result = await WebBrowser.openBrowserAsync(this.get_rs_value());
                console.log({ result });
                return true;
            }
        }
        return false;
    }

    get_status = () => {
        const params = {
            token: this.get_rs_value(),
            ern: 1234,
            amount: 6.25,
            details: JSON.stringify(this.details),
            format_return: this.format_return,
            currency: this.currency,
            allow_pending_payments: this.allow_pending_payments,
            extended_expiration: this.extended_expiration
        };
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
        this.details = [
            {
                'quantity': 1,
                'description': 'Producto Xtest',
                'price': 1.5,
                'url_product': ''
            }, {
                'quantity': 1,
                'description': 'Producto Ytest',
                'price': 4,
                'url_product': ''
            }, {
                'quantity': 1,
                'description': 'Producto Ztest',
                'price': 0.75,
                'url_product': ''
            }
        ];
        this.currency = 'USD';
        this.allow_pending_payments = 'FALSE';
        this.extended_expiration = 'FALSE';
    }

    get_rs_code = () => this.return_attr_response('code');

    get_rs_value = () => this.return_attr_response('value');

    return_attr_response = (name) => this.isObject(this.response) && this.response.hasOwnProperty(name) ?
        this.response[name] :
        null;

    isObject = (obj) => {
        return obj != null && obj.constructor.name === 'Object'
    }


}

export default Pagadito;