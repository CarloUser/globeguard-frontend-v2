import { graphql } from "@/graphql";

export const ProductCardFragment = graphql(`
  fragment ProductCard on SearchResult {
    productId
    productVariantId
    productName
    productVariantName
    slug
    sku
    description
    productAsset {
      id
      preview
    }
    productVariantAsset {
      id
      preview
    }
    price {
      __typename
      ... on PriceRange {
        min
        max
      }
      ... on SinglePrice {
        value
      }
    }
    currencyCode
  }
`);

export const ActiveCustomerFragment = graphql(`
  fragment ActiveCustomer on Customer {
    id
    firstName
    lastName
    emailAddress
  }
`);
