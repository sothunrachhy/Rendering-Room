import { Fragment, type ReactNode } from "react";

/**
 * Puts elements (usually links) into a translated sentence at its {placeholders}:
 * withLinks("You agree to the {terms}.", { terms: <Link …/> }). Word order differs
 * between English and Khmer, so the sentence decides where each link goes.
 */
export function withLinks(template: string, parts: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/).map((piece, index) => {
    const name = /^\{(\w+)\}$/.exec(piece)?.[1];
    return <Fragment key={index}>{name && name in parts ? parts[name] : piece}</Fragment>;
  });
}
