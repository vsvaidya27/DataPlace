"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { set, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { client } from "../../config";
import { useState } from "react";
import { storage } from "../../firebase-config";
import { ref, getDownloadURL } from "firebase/storage";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "must be at least 2 characters.",
  }),
  tokenID: z.string().min(1, {
    message: "must be at least 2 characters.",
  }),
  receiver: z.string().min(2, {
    message: "must be at least 2 characters.",
  }),
  amount: z.string().min(1, {
    message: "must be at least 1 characters.",
  }),
});

export function MintTokenForm() {
  const [message, setMessage] = useState({ text: "", url: "" });

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      tokenID: "",
      amount: "",
      receiver: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setMessage({ text: "Loading...", url: "" });
    const licensorIpId = values.username.replace(/^0x/, "");
    const licenseTerms = values.tokenID;
    const receiver = values.receiver.replace(/^0x/, "");
    const amount = Number(values.amount);
    try {
      const response = await client.license.mintLicenseTokens({
        licenseTermsId: licenseTerms,
        licensorIpId: `0x${licensorIpId}`,
        receiver: `0x${receiver}`,
        amount: amount,
        txOptions: { waitForTransaction: true },
      });

      console.log(
        `License Token minted at transaction hash ${response.txHash}, License ID: ${response.licenseTokenId}`
      );
      console.log(values);
      setMessage(
        { text: `License Token minted at transaction hash ${response.txHash}, License ID: ${response.licenseTokenId}`, url: ""}
      );
      if (response.txHash && response.licenseTokenId) {
        const fileRef = ref(storage, `files/0x${licensorIpId}`);
        const downloadURL = await getDownloadURL(fileRef);
        setMessage({ text: `License Token minted. Download file here:`, url: downloadURL});
        console.log("File available at", downloadURL);
      } else {
        throw new Error("Failed to mint the license token.");
      }
    } catch (error) {
      console.error("Error during the licensing process:", error);
      setMessage({ text: `${error}`, url: "" });
    }
  }
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Licensor IP ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0x106C471e78Ea840FC0EB8296a9bc0D6024B367E3"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Enter IPA ID</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tokenID"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Terms ID</FormLabel>
                <FormControl>
                  <Input placeholder="1" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the License Terms you want to mint from
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="receiver"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receiver Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0x60d6252fC31177B48732ab89f073407788F09C61"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter the address of the receiver
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mint Number of Tokens</FormLabel>
                <FormControl>
                  <Input placeholder="1" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the number of tokens to mint
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      {message.text && (
      <p className="p-2">
        {message.text} {message.url && <a href={message.url} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>Click here</a>}
      </p>
      )}
    </div>
  );
}
