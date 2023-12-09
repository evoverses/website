"use client";

import { createAccountAction } from "@/app/(authenticated)/profile/_components/actions";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { toast } from "@/components/ui/use-toast";
import { getQueueStatus } from "@/lib/evoverses/fetch";
import { redirect } from "next/navigation";
import { useForm } from "react-hook-form";

const CreateAccountButton = ({ accountId }: { accountId: string }) => {
  const form = useForm({
    mode: "onSubmit",
  });

  const onClick = async () => {
    try {
      const queueId = await createAccountAction(accountId);
      let status = "pending";
      while (true) {
        status = await getQueueStatus(queueId);
        if (status === "errored" || status === "cancelled") {
          toast({
            title: "Error",
            description: `There was an error creating your account. Status: ${status}`,
            variant: "destructive",
          });
          break;
        } else if (status === "mined") {
          toast({
            title: "Success",
            description: "Your account has been created!",
          });
          return redirect("/profile");
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (e) {
      toast({
        title: "Error",
        description: `There was an error creating your account. ${e}`,
        variant: "destructive",
      });
    }

  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onClick)}>
        <Button type="submit" variant="warning" className="!pl-4 ml-4" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Icons.spinner className="w-4 h-4" /> : "Create"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateAccountButton;
