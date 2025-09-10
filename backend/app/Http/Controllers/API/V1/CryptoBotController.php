<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use App\Helper\CustomCryptoPay;
use Klev\CryptoPayApi\Methods\CreateInvoice;
use Klev\CryptoPayApi\Types\Invoice;
use Klev\CryptoPayApi\Types\Update;
use Klev\CryptoPayApi\Types\Transfer as TypeTransfer;
use Klev\CryptoPayApi\Methods\Transfer as MethodTransfer;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Klev\CryptoPayApi\Methods\GetInvoices;
use Klev\CryptoPayApi\CryptoPayException;
use Illuminate\Support\Facades\DB;
use App\Models\CryptoPayment;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use App\Models\Transaction;
use App\Models\User;

class CryptoBotController extends Controller
{
    private $api;

    public function __construct()
    {
        $crypto_bot_token = Setting::get('crypto_bot_token');
        if (empty($crypto_bot_token)) {
            abort(404, '`crypto_bot_token` is missing or empty in the settings.');
        }

        $this->api = new CustomCryptoPay($crypto_bot_token, env('CRYPTO_PAY_TESTNET', false));
    }

    /**
     * Test the app's authentication token.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMe(Request $request)
    {
        try {
            $result = $this->api->getMe();
            return response()->json(['success' => true, 'data' => $result]);
        } catch (CryptoPayException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Get the balance of the app.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function balance(Request $request)
    {
        try {
            $result = $this->api->getBalance();
            return response()->json(['success' => true, 'data' => $result]);
        } catch (CryptoPayException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Create a new invoice.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */

    public function createInvoice(Request $request)
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric',
                'currency' => 'nullable|string',
                'currency_type' => 'nullable|string|in:crypto,fiat',
                'description' => 'nullable|string',
                'hidden_message' => 'nullable|string',
                'allow_anonymous' => 'nullable|boolean',
                'allow_comments' => 'nullable|boolean',
            ]);

            $user = $request->user();

            $data = new CreateInvoice(
                $validated['currency'] ?? 'USDT',
                $validated['amount'],
                $validated['currency_type'] ?? 'crypto'
            );

            $data->allow_anonymous = $validated['allow_anonymous'] ?? false;
            $data->allow_comments = $validated['allow_comments'] ?? false;
            $data->description = $validated['description'] ?? 'Payment invoice UID: ' . uniqid();
            $data->hidden_message = $validated['hidden_message'] ?? null;

            $createdInvoice = $this->api->createInvoice($data);

            if (empty($createdInvoice) || !isset($createdInvoice['invoice_id'])) {
                return response()->json($createdInvoice, 400);
            }

            $createdInvoice = (object) $createdInvoice;

            $payment = CryptoPayment::create([
                'user_id' => $user->id,
                'invoice_id' => $createdInvoice->invoice_id,
                'hash' => $createdInvoice->hash,
                'currency_type' => $createdInvoice->currency_type,
                'asset' => $createdInvoice->asset ?? $createdInvoice->fiat,
                'amount' => $createdInvoice->amount,
                'pay_url' => $createdInvoice->pay_url,
                'bot_invoice_url' => $createdInvoice->bot_invoice_url,
                'mini_app_invoice_url' => $createdInvoice->mini_app_invoice_url ?? null,
                'web_app_invoice_url' => $createdInvoice->web_app_invoice_url ?? null,
                'description' => $createdInvoice->description ?? null,
                'status' => $createdInvoice->status,
                'created_at' => $createdInvoice->created_at,
                'allow_comments' => $createdInvoice->allow_comments ?? false,
                'allow_anonymous' => $createdInvoice->allow_anonymous ?? false,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'invoice' => $createdInvoice
                ]
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (CryptoPayException $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Unexpected error',
                'details' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Get a list of invoices.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getInvoices(Request $request)
    {
        try {
            $getInvoices = new GetInvoices();
            if ($request->has('status')) {
                $getInvoices->status = $request->input('status');
            }
            if ($request->has('offset')) {
                $getInvoices->offset = $request->input('offset');
            }
            if ($request->has('count')) {
                $getInvoices->count = $request->input('count');
            }

            $invoices = $this->api->getInvoices($getInvoices);
            return response()->json(['success' => true, 'data' => $invoices]);
        } catch (CryptoPayException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Transfer coins to a user.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    // public function transfer(Request $request)
    // {
    //     try {
    //         $validated = $request->validate([
    //             'user_id' => 'required|string',
    //             'asset' => 'required|string',
    //             'amount' => 'required|numeric|min:0.01',
    //             'spend_id' => 'required|string',
    //             'comment' => 'nullable|string',
    //         ]);

    //         $transfer = new MethodTransfer(
    //             $validated['user_id'],
    //             $validated['asset'],
    //             $validated['amount'],
    //             $validated['spend_id']
    //         );
    //         $transfer->comment = $validated['comment'] ?? null;

    //         $result = $this->api->transfer($transfer);
    //         return response()->json(['success' => true, 'data' => $result]);
    //     } catch (CryptoPayException $e) {
    //         return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
    //     } catch (\Exception $e) {
    //         return response()->json(['success' => false, 'message' => 'Invalid request data'], 422);
    //     }
    // }

    /**
     * Get exchange rates of supported currencies.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getExchangeRates(Request $request)
    {
        try {
            $result = $this->api->getExchangeRates();
            return response()->json(['success' => true, 'data' => $result]);
        } catch (CryptoPayException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Get a list of supported currencies.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCurrencies(Request $request)
    {
        try {
            $result = $this->api->getCurrencies();
            return response()->json(['success' => true, 'data' => $result]);
        } catch (CryptoPayException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Handle webhook updates from Crypto Pay.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    // public function webhook(Request $request)
    // {
    //     Log::info('Webhook raw input: ' . $request->getContent());
    //     Log::info('Webhook headers: ' . json_encode($request->headers->all()));

    //     $rawUpdates = $request->getContent();
    //     $signature = $request->header('crypto-pay-api-signature', false);
    //     Log::info('Signature: ' . $signature);
    //     try {
    //         $is_checked = $this->api->verifyWebhookUpdates($rawUpdates, $signature, true);
    //         Log::info('Webhook verification result: ' . ($is_checked ? 'true' : 'false'));
    //         if ($is_checked) {


    //             return response()->json(['success' => true, 'message' => 'Webhook verified and processed.']);
    //         }else{
    //             return response()->json(['success' => false, 'message' => 'Webhook verification failed.'], 400);
    //         }
    //     } catch (CryptoPayException $e) {
    //         return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
    //     }
    // }

    public function webhook(Request $request)
    {
        $rawUpdates = $request->getContent();
        $signature = $request->header('crypto-pay-api-signature', false);

        try {
            $is_checked = $this->api->verifyWebhookUpdates($rawUpdates, $signature, true);

            if (!$is_checked) {
                return response()->json(['success' => false, 'message' => 'Webhook verification failed.'], 400);
            }

            $data = json_decode($rawUpdates, true);
            $payload = Arr::get($data, 'payload', []);

            // 🔐 Safe extraction with defaults
            $invoiceId = Arr::get($payload, 'invoice_id');
            $amountTON = floatval(Arr::get($payload, 'paid_amount', 0));
            $usdRate = floatval(Arr::get($payload, 'paid_usd_rate', Arr::get($payload, 'usd_rate', 0)));
            // $amountUSDT = round($amountTON * $usdRate, 2);
            $amountUSDT = floor($amountTON * $usdRate * 100) / 100;


            // 🧾 Save to CryptoPayment
            CryptoPayment::updateOrCreate(
                ['invoice_id' => $invoiceId],
                [
                    'hash' => Arr::get($payload, 'hash'),
                    'currency_type' => Arr::get($payload, 'currency_type'),
                    'asset' => Arr::get($payload, 'asset'),
                    'amount' => Arr::get($payload, 'amount'),
                    'paid_asset' => Arr::get($payload, 'paid_asset'),
                    'paid_amount' => $amountTON,
                    'fee_amount' => Arr::get($payload, 'fee_amount'),
                    'fee_in_usd' => Arr::get($payload, 'fee_in_usd'),
                    'usd_rate' => $usdRate,
                    'paid_usd_rate' => $usdRate,
                    'pay_url' => Arr::get($payload, 'pay_url'),
                    'description' => Arr::get($payload, 'description'),
                    'status' => Arr::get($payload, 'status'),
                    'allow_comments' => Arr::get($payload, 'allow_comments', false),
                    'allow_anonymous' => Arr::get($payload, 'allow_anonymous', false),
                    'paid_anonymously' => Arr::get($payload, 'paid_anonymously', false),
                    'created_at' => Carbon::parse(Arr::get($payload, 'created_at')),
                    'paid_at' => Carbon::parse(Arr::get($payload, 'paid_at')),
                ]
            );

            $cyptoPayment = CryptoPayment::where('invoice_id', $invoiceId)->first();
            $cyptoPayment->transaction()->create([
                'user_id' => $cyptoPayment->user_id,
                'type' => 'deposit',
                'amount' => $amountUSDT,
                'status' => 'completed',
                'transaction_id' => $cyptoPayment->hash,
                'paid_at' => Carbon::parse(Arr::get($payload, 'paid_at')),
                'description' => 'Deposit made via CryptoBot: ' . $cyptoPayment->description
            ]);
            User::where('id', $cyptoPayment->user_id)->update([
                'balance' => DB::raw("balance + {$amountUSDT}"),
                'last_deposit_at' => Carbon::now(),
            ]);

            Log::info('Webhook processed: ' . json_encode($data));

            return response()->json(['success' => true, 'message' => 'Webhook processed successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}