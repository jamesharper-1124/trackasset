<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $token;
    public $email;

    /**
     * Create a new message instance.
     */
    public function __construct($token, $email)
    {
        $this->token = $token;
        $this->email = $email;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Password - TrackAsset',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        // Simple inline view for now, usually better to have separate blade view
        return new Content(
            html: 'emails.reset_password',
        );
    }

    public function build()
    {
        return $this->view('emails.reset_password')
            ->subject('Reset Password Notification')
            ->with([
                'link' => route('password.reset', ['token' => $this->token, 'email' => $this->email])
            ]);
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
