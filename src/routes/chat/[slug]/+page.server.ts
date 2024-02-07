
export async function load({params}) {

    const thread = {
        threadId: params.slug,
    }

    return{
        thread
    };
}
