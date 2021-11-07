import { Query, Resolver } from "type-graphql";

@Resolver()
export class TestResolver {
    @Query()
    test() {
        return "TETTETETE"
    }
}