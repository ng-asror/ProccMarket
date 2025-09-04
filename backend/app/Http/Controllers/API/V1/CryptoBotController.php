<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Klev\CryptoPayApi\CryptoPay;

class CryptoBotController extends Controller
{
    private $api;

    public function __construct()
    {
        $crypto_bot_token = Setting::get('crypto_bot_token');
        if (empty($crypto_bot_token)) {
            abort(404, '`crypto_bot_token` is missing or empty in the settings.');
        }

        $this->api = new CryptoPay($crypto_bot_token, true);
    }


    public function getMe(Request $request)
    {
        return $this->api->getMe();
    }
}
